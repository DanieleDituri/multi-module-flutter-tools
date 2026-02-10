import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export async function hasPubspec(dir: string): Promise<boolean> {
    try {
        await fs.stat(path.join(dir, "pubspec.yaml"));
        return true;
    } catch {
        return false;
    }
}

function shouldSkipEntry(
    entry: import("node:fs").Dirent,
    excludeFolders: string[],
): boolean {
    if (!entry.isDirectory()) {
        return true;
    }
    if (entry.name === "." || entry.name === "..") {
        return true;
    }
    if (excludeFolders.includes(entry.name)) {
        return true;
    }
    return false;
}

export async function discoverFlutterProjects(
    root: string,
    options: { maxDepth: number; excludeFolders: string[] },
): Promise<string[]> {
    const projects = new Set<string>();
    type Item = { dir: string; depth: number };
    const stack: Item[] = [{ dir: root, depth: 0 }];

    while (stack.length > 0) {
        const { dir, depth } = stack.pop()!;

        if (await hasPubspec(dir)) {
            projects.add(dir);
            continue;
        }

        if (depth >= options.maxDepth) {
            continue;
        }

        let entries: import("node:fs").Dirent[] = [];
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            if (shouldSkipEntry(entry, options.excludeFolders)) {
                continue;
            }
            const child = path.join(dir, entry.name);
            stack.push({ dir: child, depth: depth + 1 });
        }
    }

    return Array.from(projects);
}

export async function getAllFlutterProjects(): Promise<string[]> {
    const config = vscode.workspace.getConfiguration("multiModuleFlutter");
    const scanNested = config.get<boolean>("scanNested", true);
    const maxDepth = config.get<number>("maxDepth", 2);
    const excludeFolders = config.get<string[]>("excludeFolders", [
        "node_modules",
        ".git",
        ".dart_tool",
        "dist",
        "build",
        "out",
    ]);

    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
        return [];
    }

    const allProjects: string[] = [];
    for (const folder of folders) {
        const root = folder.uri.fsPath;
        if (scanNested) {
            const projects = await discoverFlutterProjects(root, {
                maxDepth,
                excludeFolders,
            });
            allProjects.push(...projects);
        } else if (await hasPubspec(root)) {
            allProjects.push(root);
        }
    }
    return [...new Set(allProjects)];
}
