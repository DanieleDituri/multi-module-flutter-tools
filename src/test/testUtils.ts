import * as vscode from "vscode";
import { ProjectInfo } from "../types.js";

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
