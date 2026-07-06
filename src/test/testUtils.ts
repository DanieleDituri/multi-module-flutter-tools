import * as vscode from "vscode";
import { ProjectInfo } from "../types.js";
import { EventEmitter } from "events";

export class MockOutputChannel {
  name = "Mock Output";
  messages: string[] = [];

  append(value: string): void {
    this.messages.push(value);
  }

  appendLine(value: string): void {
    this.messages.push(value + "\n");
  }

  clear(): void {
    this.messages = [];
  }

  show(): void {
    // Mock implementation
  }

  hide(): void {
    // Mock implementation
  }

  replace(): void {
    // Mock implementation
  }

  dispose(): void {
    // Mock implementation
  }

  getOutput(): string {
    return this.messages.join("");
  }

  hasMessage(text: string): boolean {
    return this.messages.some(msg => msg.includes(text));
  }
}

export class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();

  constructor(public exitCode: number = 0, public shouldError: boolean = false) {
    super();
  }

  kill(): void {
    // Mock kill
  }
}

export function createMockSpawn(exitCode: number = 0, shouldError: boolean = false) {
  return (_command: string, _args: string[], _options?: any) => {
    const child = new MockChildProcess(exitCode, shouldError);

    setImmediate(() => {
      if (shouldError) {
        child.emit("error", new Error("Command failed"));
      } else {
        if (exitCode === 0) {
          (child.stdout as EventEmitter).emit("data", Buffer.from("output"));
        } else {
          (child.stderr as EventEmitter).emit("data", Buffer.from("error"));
        }
        child.emit("close", exitCode);
      }
    });

    return child;
  };
}

export class MockFileSystem {
  files: Map<string, string> = new Map();

  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      const error: any = new Error(`ENOENT: no such file or directory, open '${path}'`);
      error.code = "ENOENT";
      throw error;
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
}

export class MockGit {
  stashList: string[] = [];

  async raw(args: string[]): Promise<string> {
    if (args[0] === "stash" && args[1] === "list") {
      return this.stashList.join("\n");
    }
    if (args[0] === "stash" && args[1] === "pop") {
      if (this.stashList.length === 0) {
        throw new Error("No stash entries found");
      }
      this.stashList.pop();
      return "";
    }
    return "";
  }

  addStash(message: string, index: number = 0): void {
    this.stashList.push(`stash@{${index}}: WIP on main: ${message}`);
  }
}

export class MockCancellationToken {
  private _cancelled = false;
  private _handlers: Array<() => void> = [];

  get isCancellationRequested(): boolean {
    return this._cancelled;
  }

  onCancellationRequested(listener: () => void): vscode.Disposable {
    this._handlers.push(listener);
    return {
      dispose: () => {
        this._handlers = this._handlers.filter(h => h !== listener);
      },
    };
  }

  cancel(): void {
    this._cancelled = true;
    this._handlers.forEach(h => h());
  }
}

export const MOCK_PROJECTS: ProjectInfo[] = [
  { name: "app", path: "/workspace/app" },
  { name: "core", path: "/workspace/core" },
  { name: "feature_a", path: "/workspace/feature_a" },
];

export const MOCK_PROJECT_SINGLE: ProjectInfo[] = [
  { name: "app", path: "/workspace/app" },
];

export const MOCK_WORKSPACE_FOLDERS: vscode.WorkspaceFolder[] = [
  {
    uri: vscode.Uri.file("/workspace"),
    name: "workspace",
    index: 0,
  },
];

export function createMockProjectInfo(name: string, path: string): ProjectInfo {
  return { name, path };
}

export function createMockOutputChannel(): MockOutputChannel {
  return new MockOutputChannel();
}

export function createMockCancellationToken(): MockCancellationToken {
  return new MockCancellationToken();
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const TEST_CONSTANTS = {
  TIMEOUT_MS: 5000,
  SMALL_DELAY_MS: 100,
  MODULE_NAMES: ["app", "core", "feature_a"],
  WORKSPACE_PATH: "/workspace",
};

export function createMockProgress() {
  return {
    report: (value: { message?: string; increment?: number }) => {
      // Mock progress report
    },
  };
}

export function createMockToken() {
  return new MockCancellationToken();
}

export const MOCK_PUBSPEC_YAML = `name: app
description: Test Flutter app
version: 1.0.0

dependencies:
  flutter:
    sdk: flutter
  core:
    path: ../core
  feature_a:
    sdk: flutter
`;

export const MOCK_PUBSPEC_YAML_WITH_REMOTE_DEPS = `name: app
description: Test Flutter app
version: 1.0.0

dependencies:
  flutter:
    sdk: flutter
  core:
    hosted:
      name: core
      url: https://pub.dev
  feature_a:
    sdk: flutter
`;

export const MOCK_STASH_LIST = `stash@{0}: WIP on main: setup
stash@{1}: WIP on main: changes
`;

export const MOCK_GIT_LOGS = `commit abc123
Author: Test User <test@example.com>
Date: Sun Jul 6 2026

    Initial commit

commit def456
Author: Test User <test@example.com>
Date: Mon Jul 5 2026

    Second commit
`;
