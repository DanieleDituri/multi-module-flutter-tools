import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { simpleGit, SimpleGit } from "simple-git";
import { getAllFlutterProjects } from "./repoDiscovery";
import { MultiModuleViewProvider } from "./multiModuleViewProvider.js";

export type ProjectInfo = { name: string; path: string };

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

function runShellCommand(
  command: string,
  cwd: string | undefined,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken,
): Promise<{ ok: boolean }> {
  const proxied = applyFvmProxy(command);
  output.appendLine(`$ ${proxied}`);

  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", proxied], { cwd });

    const cancelDisposable = token?.onCancellationRequested(() => {
      child.kill();
      resolve({ ok: false });
    });

    child.stdout.on("data", (chunk: Buffer) => {
      output.append(chunk.toString());
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output.append(chunk.toString());
    });

    child.on("close", (code) => {
      cancelDisposable?.dispose();
      resolve({ ok: code === 0 });
    });

    child.on("error", (err) => {
      cancelDisposable?.dispose();
      output.appendLine(`Error: ${err.message}`);
      resolve({ ok: false });
    });
  });
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
  action: (project: ProjectInfo, token: vscode.CancellationToken) => Promise<void>,
  output: vscode.OutputChannel,
) {
  const projectList = projects ?? (await getAllProjects());
  if (projectList.length === 0) {
    vscode.window.showWarningMessage("No Flutter modules found.");
    return;
  }

  output.clear();
  output.show(true);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `${operationName} on ${projectList.length} module(s)`,
      cancellable: true,
    },
    async (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken,
    ) => {
      const increment = 100 / projectList.length;
      for (const project of projectList) {
        if (token.isCancellationRequested) {
          break;
        }
        progress.report({ message: project.name, increment });
        output.appendLine(`\n=== ${project.name} » ${operationName} ===`);
        try {
          await action(project, token);
        } catch (error: any) {
          output.appendLine(`Error: ${error?.message || error}`);
        }
      }
    },
  );
}

async function runWorkspaceOperation(
  operationName: string,
  action: (root: string, token: vscode.CancellationToken) => Promise<void>,
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
  output.show(true);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `${operationName} on ${roots.length} workspace(s)`,
      cancellable: true,
    },
    async (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken,
    ) => {
      const increment = 100 / roots.length;
      for (const root of roots) {
        if (token.isCancellationRequested) {
          break;
        }
        progress.report({ message: path.basename(root), increment });
        output.appendLine(`\n=== ${path.basename(root)} » ${operationName} ===`);
        try {
          await action(root, token);
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

function runTestsInTerminal(projects: ProjectInfo[]): void {
  if (projects.length === 0) {
    return;
  }

  const termName =
    projects.length === 1
      ? `flutter test — ${projects[0].name}`
      : `flutter test (${projects.length} modules)`;

  const terminal = vscode.window.createTerminal({
    name: termName,
    cwd: projects.length === 1 ? projects[0].path : undefined,
  });
  terminal.show();

  for (const project of projects) {
    if (projects.length > 1) {
      terminal.sendText(
        `echo "\\033[1;36m\\n=== ${project.name} ===\\033[0m" && cd "${project.path}"`,
      );
    }
    terminal.sendText(applyFvmProxy("flutter test"));
  }
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
      async (root, token) => {
        await runShellCommand("flutter pub cache repair", root, output, token);
        await runShellCommand("dart pub cache repair", root, output, token);
      },
      output,
    );
  };

  const runCacheClean = async () => {
    await runWorkspaceOperation(
      "Cache Clean",
      async (root, token) => {
        await runShellCommand("flutter pub cache clean --force", root, output, token);
        await runShellCommand("dart pub cache clean --force", root, output, token);
      },
      output,
    );
  };

  const runCleanWorkspaces = async () => {
    await runProjectOperation(
      "Clean",
      undefined,
      async (project, token) => {
        await runShellCommand("flutter clean", project.path, output, token);
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
      async (project, token) => {
        await runShellCommand("flutter pub get", project.path, output, token);
      },
      output,
    );
  };

  const runPubUpgradeAll = async () => {
    await runProjectOperation(
      "Pub Upgrade",
      undefined,
      async (project, token) => {
        await runShellCommand("flutter pub upgrade", project.path, output, token);
      },
      output,
    );
  };

  const runPubOutdatedAll = async () => {
    await runProjectOperation(
      "Pub Outdated",
      undefined,
      async (project, token) => {
        await runShellCommand("flutter pub outdated", project.path, output, token);
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
    output.show(true);

    const steps: { cmd: string; fatal: boolean }[] = [
      { cmd: "dart format -l 120 ./lib", fatal: true },
      { cmd: "dart run build_runner clean", fatal: true },
      { cmd: "dart run build_runner build --delete-conflicting-outputs", fatal: true },
      { cmd: "flutter analyze", fatal: false },
    ];

    let allPassed = false;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Checks on ${project.name}`,
        cancellable: true,
      },
      async (
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken,
      ) => {
        const increment = 100 / (steps.length + 1);
        for (const step of steps) {
          if (token.isCancellationRequested) {
            return;
          }
          progress.report({ message: step.cmd, increment });
          output.appendLine(`\n=== ${project.name} » ${step.cmd} ===`);
          const result = await runShellCommand(step.cmd, project.path, output, token);
          if (!result.ok && step.fatal) {
            output.appendLine("Stopping on first failure.");
            return;
          }
        }
        allPassed = true;
        progress.report({ message: "flutter test", increment });
      },
    );

    if (allPassed) {
      runTestsInTerminal([project]);
    }
  };

  const runBuildRunnerChecksOnSelected = async () => {
    const projects = await getAllProjects();
    if (projects.length === 0) {
      vscode.window.showWarningMessage("No Flutter modules found.");
      return;
    }

    const picks = projects.map((project) => ({
      label: project.name,
      description: project.path,
      project,
    }));

    const choices = await vscode.window.showQuickPick(picks, {
      placeHolder: "Select modules to run build_runner, analyze and test",
      canPickMany: true,
    });

    if (!choices || choices.length === 0) {
      return;
    }

    const selected = choices.map((c: { project: ProjectInfo }) => c.project);

    output.clear();
    output.show(true);

    const steps: { cmd: string; fatal: boolean }[] = [
      { cmd: "dart run build_runner build --delete-conflicting-outputs", fatal: true },
      { cmd: "flutter analyze", fatal: false },
    ];

    const readyForTest: ProjectInfo[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Build Runner + Analyze on ${selected.length} module(s)`,
        cancellable: true,
      },
      async (
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken,
      ) => {
        const increment = 100 / selected.length;
        for (const project of selected) {
          if (token.isCancellationRequested) {
            break;
          }
          progress.report({ message: project.name, increment });
          output.appendLine(`\n=== ${project.name} ===`);
          let passed = true;
          for (const step of steps) {
            if (token.isCancellationRequested) {
              passed = false;
              break;
            }
            output.appendLine(`--- ${step.cmd} ---`);
            const result = await runShellCommand(step.cmd, project.path, output, token);
            if (!result.ok && step.fatal) {
              output.appendLine("Stopping on first failure.");
              passed = false;
              break;
            }
          }
          if (passed) {
            readyForTest.push(project);
          }
        }
      },
    );

    if (readyForTest.length > 0) {
      runTestsInTerminal(readyForTest);
    }
  };

  const runFixedSeries = async () => {
    const projects = await getAllProjects();
    if (projects.length === 0) {
      vscode.window.showWarningMessage("No Flutter modules found.");
      return;
    }

    const roots = vscode.workspace.workspaceFolders?.map(
      (folder: vscode.WorkspaceFolder) => folder.uri.fsPath,
    ) ?? [];

    output.clear();
    output.show(true);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Fixed Series: Clean Cache → Clean → Local Deps → Pub Get",
        cancellable: true,
      },
      async (
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken,
      ) => {
        progress.report({ message: "Cleaning cache..." });
        output.appendLine("\n=== Step 1: Clean Cache ===");
        for (const root of roots) {
          if (token.isCancellationRequested) {
            return;
          }
          output.appendLine(`\n--- ${path.basename(root)} ---`);
          await runShellCommand("flutter pub cache clean --force", root, output, token);
          await runShellCommand("dart pub cache clean --force", root, output, token);
        }

        progress.report({ message: "Cleaning workspaces..." });
        output.appendLine("\n=== Step 2: Clean Workspaces ===");
        for (const project of projects) {
          if (token.isCancellationRequested) {
            return;
          }
          output.appendLine(`\n--- ${project.name} ---`);
          await runShellCommand("flutter clean", project.path, output, token);
          await fs.unlink(path.join(project.path, "pubspec.lock")).catch(() => undefined);
        }

        progress.report({ message: "Converting deps to local..." });
        output.appendLine("\n=== Step 3: Convert Dependencies to Local ===");
        const names = projects.map((p) => p.name);
        for (const project of projects) {
          if (token.isCancellationRequested) {
            return;
          }
          output.appendLine(`\n--- ${project.name} ---`);
          const updated = await convertDependenciesToLocal(project.path, names);
          output.appendLine(updated ? "Updated pubspec.yaml." : "No changes needed.");
        }

        progress.report({ message: "Running pub get..." });
        output.appendLine("\n=== Step 4: Pub Get ===");
        for (const project of projects) {
          if (token.isCancellationRequested) {
            return;
          }
          output.appendLine(`\n--- ${project.name} ---`);
          await runShellCommand("flutter pub get", project.path, output, token);
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
      async (project, token) => {
        await runShellCommand(command, project.path, output, token);
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
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.buildRunnerChecks",
      runBuildRunnerChecksOnSelected,
    ),
    vscode.commands.registerCommand(
      "multi-module-flutter-tools.fixedSeries",
      runFixedSeries,
    ),
  );
}
