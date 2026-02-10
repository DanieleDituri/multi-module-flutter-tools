import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { simpleGit, SimpleGit } from "simple-git";
import { getAllFlutterProjects } from "./repoDiscovery";
import { MultiModuleViewProvider } from "./multiModuleViewProvider.js";

export type ProjectInfo = { name: string; path: string };

type CommandResult = { ok: boolean; stdout: string; stderr: string };

const execAsync = promisify(exec);

function createOutput(): vscode.OutputChannel {
  return vscode.window.createOutputChannel("Multi Module Flutter Tools");
}

function getConfig() {
  return vscode.workspace.getConfiguration("multiModuleFlutter");
}

function applyFvmProxy(command: string): string {
  const useFvm = getConfig().get<boolean>("useFvm", false);
  if (!useFvm) {
    return command;
  }

  const trimmed = command.trim();
  if (trimmed === "flutter" || trimmed.startsWith("flutter ")) {
    return `fvm ${command}`;
  }
  if (trimmed === "dart" || trimmed.startsWith("dart ")) {
    return `fvm ${command}`;
  }
  return command;
}

async function runShellCommand(
  command: string,
  cwd?: string,
): Promise<CommandResult> {
  const proxied = applyFvmProxy(command);
  try {
    const { stdout, stderr } = await execAsync(proxied, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, stdout: stdout ?? "", stderr: stderr ?? "" };
  } catch (error: any) {
    return {
      ok: false,
      stdout: error?.stdout ?? "",
      stderr: error?.stderr ?? error?.message ?? "Unknown error",
    };
  }
}

function appendCommandOutput(
  output: vscode.OutputChannel,
  command: string,
  result: CommandResult,
) {
  output.appendLine(`$ ${applyFvmProxy(command)}`);
  if (result.stdout) {
    output.append(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`);
  }
  if (result.stderr) {
    output.append(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
  }
}

async function getAllProjects(): Promise<ProjectInfo[]> {
  const projectPaths = await getAllFlutterProjects();
  return projectPaths
    .map((projectPath) => ({
      name: path.basename(projectPath),
      path: projectPath,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function pickProject(
  projects: ProjectInfo[],
): Promise<ProjectInfo | undefined> {
  const picks = projects.map((project) => ({
    label: project.name,
    description: project.path,
    project,
  }));

  const choice = await vscode.window.showQuickPick(picks, {
    placeHolder: "Select a Flutter module",
  });

  return choice?.project;
}

async function runProjectOperation(
  operationName: string,
  projects: ProjectInfo[] | undefined,
  action: (project: ProjectInfo) => Promise<void>,
  output: vscode.OutputChannel,
) {
  const projectList = projects ?? (await getAllProjects());
  if (projectList.length === 0) {
    vscode.window.showWarningMessage("No Flutter modules found.");
    return;
  }

  output.clear();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `${operationName} on ${projectList.length} module(s)`,
      cancellable: true,
    },
    async (
      _progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken,
    ) => {
      for (const project of projectList) {
        if (token.isCancellationRequested) {
          break;
        }
        output.appendLine(`\n=== ${project.name} » ${operationName} ===`);
        try {
          await action(project);
        } catch (error: any) {
          output.appendLine(`Error: ${error?.message || error}`);
        }
      }
    },
  );
}

async function runWorkspaceOperation(
  operationName: string,
  action: (root: string) => Promise<void>,
  output: vscode.OutputChannel,
) {
  const roots = vscode.workspace.workspaceFolders?.map(
    (folder: vscode.WorkspaceFolder) => folder.uri.fsPath,
  );
  if (!roots || roots.length === 0) {
    vscode.window.showWarningMessage("No workspace folders found.");
    return;
  }

  output.clear();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `${operationName} on ${roots.length} workspace(s)`,
      cancellable: true,
    },
    async (
      _progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken,
    ) => {
      for (const root of roots) {
        if (token.isCancellationRequested) {
          break;
        }
        output.appendLine(`\n=== ${path.basename(root)} » ${operationName} ===`);
        try {
          await action(root);
        } catch (error: any) {
          output.appendLine(`Error: ${error?.message || error}`);
        }
      }
    },
  );
}

function isActivePathLine(line: string): boolean {
  const index = line.indexOf("path");
  if (index < 0) {
    return false;
  }
  const before = line.slice(0, index);
  return !before.includes("#");
}

async function convertDependenciesToLocal(
  projectPath: string,
  projectNames: string[],
): Promise<boolean> {
  const filePath = path.join(projectPath, "pubspec.yaml");
  let contents = "";

  try {
    contents = await fs.readFile(filePath, "utf8");
  } catch {
    return false;
  }

  const lines = contents.split(/\r?\n/);
  const updatedLines: string[] = [];
  let updated = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || line.trim().startsWith("#")) {
      updatedLines.push(line);
      continue;
    }

    let replaced = false;
    for (const dep of projectNames) {
      const trimmed = line.trim();
      if (!trimmed.startsWith(`${dep}:`)) {
        continue;
      }

      const nextLine = lines[i + 1] ?? "";
      if (isActivePathLine(nextLine)) {
        break;
      }

      updatedLines.push(`  ${dep}:`, `    path: ../${dep}`);
      updated = true;
      replaced = true;
      break;
    }

    if (!replaced) {
      updatedLines.push(line);
    }
  }

  if (updated) {
    await fs.writeFile(filePath, updatedLines.join("\n"), "utf8");
  }

  return updated;
}

async function popNamedStash(
  git: SimpleGit,
  stashMessage: string,
): Promise<boolean> {
  const list = await git.raw(["stash", "list"]);
  const lines = list.split(/\r?\n/).filter(Boolean);
  const match = lines.find((line: string) => line.includes(stashMessage));
  if (!match) {
    return false;
  }

  const refMatch = match.match(/stash@{(\d+)}/);
  if (!refMatch) {
    return false;
  }

  await git.raw(["stash", "pop", "--index", `stash@{${refMatch[1]}}`]);
  return true;
}

export function activate(context: vscode.ExtensionContext) {
  const output = createOutput();
  const provider = new MultiModuleViewProvider(context.extensionUri, output);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MultiModuleViewProvider.viewType,
      provider,
    ),
  );

  const runCacheRepair = async () => {
    await runWorkspaceOperation(
      "Cache Repair",
      async (root) => {
        const flutter = await runShellCommand(
          "flutter pub cache repair",
          root,
        );
        appendCommandOutput(output, "flutter pub cache repair", flutter);

        const dart = await runShellCommand("dart pub cache repair", root);
        appendCommandOutput(output, "dart pub cache repair", dart);
      },
      output,
    );
  };

  const runCacheClean = async () => {
    await runWorkspaceOperation(
      "Cache Clean",
      async (root) => {
        const flutter = await runShellCommand(
          "flutter pub cache clean --force",
          root,
        );
        appendCommandOutput(output, "flutter pub cache clean --force", flutter);

        const dart = await runShellCommand(
          "dart pub cache clean --force",
          root,
        );
        appendCommandOutput(output, "dart pub cache clean --force", dart);
      },
      output,
    );
  };

  const runCleanWorkspaces = async () => {
    await runProjectOperation(
      "Clean",
      undefined,
      async (project) => {
        const clean = await runShellCommand("flutter clean", project.path);
        appendCommandOutput(output, "flutter clean", clean);

        await fs
          .unlink(path.join(project.path, "pubspec.lock"))
          .catch(() => undefined);
      },
      output,
    );
  };

  const runPubGetAll = async () => {
    await runProjectOperation(
      "Pub Get",
      undefined,
      async (project) => {
        const result = await runShellCommand("flutter pub get", project.path);
        appendCommandOutput(output, "flutter pub get", result);
      },
      output,
    );
  };

  const runPubUpgradeAll = async () => {
    await runProjectOperation(
      "Pub Upgrade",
      undefined,
      async (project) => {
        const result = await runShellCommand(
          "flutter pub upgrade",
          project.path,
        );
        appendCommandOutput(output, "flutter pub upgrade", result);
      },
      output,
    );
  };

  const runPubOutdatedAll = async () => {
    await runProjectOperation(
      "Pub Outdated",
      undefined,
      async (project) => {
        const result = await runShellCommand(
          "flutter pub outdated",
          project.path,
        );
        appendCommandOutput(output, "flutter pub outdated", result);
      },
      output,
    );
  };

  const runRevertPubspec = async () => {
    await runProjectOperation(
      "Revert pubspec.yaml",
      undefined,
      async (project) => {
        const git = simpleGit(project.path);
        await git.raw(["checkout", "--quiet", "pubspec.yaml"]);
        output.appendLine("Reverted pubspec.yaml.");
      },
      output,
    );
  };

  const runPullUpdateAll = async () => {
    await runProjectOperation(
      "Pull/Update",
      undefined,
      async (project) => {
        const git = simpleGit(project.path);
        const stashMessage = `flutter-tools-${Date.now().toString(36)}`;

        await git.raw(["checkout", "--quiet", "pubspec.yaml"]);
        await git.raw(["stash", "push", "-m", stashMessage]);
        await git.pull(undefined, undefined, { "--rebase": null });
        const restored = await popNamedStash(git, stashMessage);
        output.appendLine(
          restored ? "Restored stash." : "No matching stash to restore.",
        );
      },
      output,
    );
  };

  const runDepsToLocal = async () => {
    const projects = await getAllProjects();
    const names = projects.map((project) => project.name);

    await runProjectOperation(
      "Convert dependencies to local",
      projects,
      async (project) => {
        const updated = await convertDependenciesToLocal(project.path, names);
        output.appendLine(
          updated ? "Updated pubspec.yaml." : "No changes needed.",
        );
      },
      output,
    );
  };

  const runChangeBranchAll = async () => {
    const branch = await vscode.window.showInputBox({
      title: "Branch name",
      prompt: "Enter the branch name to checkout",
    });
    if (!branch) {
      return;
    }

    await runProjectOperation(
      `Checkout ${branch}`,
      undefined,
      async (project) => {
        const git = simpleGit(project.path);
        await git.checkout(branch);
        output.appendLine(`Checked out ${branch}.`);
      },
      output,
    );
  };

  const runChecksOnProject = async () => {
    const projects = await getAllProjects();
    if (projects.length === 0) {
      vscode.window.showWarningMessage("No Flutter modules found.");
      return;
    }

    const project = await pickProject(projects);
    if (!project) {
      return;
    }

    output.clear();

    const steps = [
      { label: "dart format -l 120 ./lib", command: "dart format -l 120 ./lib" },
      { label: "dart run build_runner clean", command: "dart run build_runner clean" },
      {
        label: "dart run build_runner build --delete-conflicting-outputs",
        command: "dart run build_runner build --delete-conflicting-outputs",
      },
      { label: "flutter analyze", command: "flutter analyze" },
      { label: "flutter test", command: "flutter test" },
    ];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Checks on ${project.name}`,
        cancellable: true,
      },
      async (
        _progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken,
      ) => {
        for (const step of steps) {
          if (token.isCancellationRequested) {
            break;
          }
          output.appendLine(`\n=== ${project.name} » ${step.label} ===`);
          const result = await runShellCommand(step.command, project.path);
          appendCommandOutput(output, step.command, result);
          if (!result.ok) {
            output.appendLine("Stopping on first failure.");
            break;
          }
        }
      },
    );
  };

  const runCustomCommandAll = async () => {
    const command = await vscode.window.showInputBox({
      title: "Command to run",
      prompt: "Enter a shell command to run in every Flutter module",
      value: "flutter pub get",
    });
    if (!command) {
      return;
    }

    await runProjectOperation(
      `Run: ${command}`,
      undefined,
      async (project) => {
        const result = await runShellCommand(command, project.path);
        appendCommandOutput(output, command, result);
      },
      output,
    );
  };


  context.subscriptions.push(
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.cacheRepair",
      runCacheRepair,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.cacheClean",
      runCacheClean,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.cleanWorkspaces",
      runCleanWorkspaces,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.pubGetAll",
      runPubGetAll,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.pubUpgradeAll",
      runPubUpgradeAll,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.pubOutdatedAll",
      runPubOutdatedAll,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.revertPubspec",
      runRevertPubspec,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.pullUpdateAll",
      runPullUpdateAll,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.depsToLocal",
      runDepsToLocal,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.changeBranchAll",
      runChangeBranchAll,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.runChecks",
      runChecksOnProject,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.runCustomAll",
      runCustomCommandAll,
    ),
  );
}

