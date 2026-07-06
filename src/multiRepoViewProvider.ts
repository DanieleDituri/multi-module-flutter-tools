import * as vscode from "vscode";
import { BaseWebviewProvider, uiScaleMultiplier, getNonce } from "./viewProviderUtils.js";

export class MultiRepoViewProvider extends BaseWebviewProvider {
  public static readonly viewType = "multi-repo-flutter-view";

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);
  }

  protected getHtmlForWebview(webview: vscode.Webview): string {
    const codiconsUri = this.getCodiconsUri(webview);

    const scale = uiScaleMultiplier(
      vscode.workspace.getConfiguration("multiModuleFlutter").get<string>("uiScale", "medium"),
    );
    const buttonHeight = `${Math.round(75 * scale)}px`;
    const iconSize = `${Math.round(24 * scale)}px`;
    const h3Size = `${+(1.1 * scale).toFixed(3)}em`;
    const btnLabelSize = `${+(0.9 * scale).toFixed(3)}em`;

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <title>Multi Module Flutter Tools</title>
        <link href="${codiconsUri}" rel="stylesheet" />
        <style>
          :root {
            --button-height: ${buttonHeight};
          }
          * {
            --button-height: ${buttonHeight};
          }
          body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
          }
          h3 {
            font-size: ${h3Size};
            margin-bottom: 8px;
            text-transform: uppercase;
            opacity: 0.8;
          }
          .section {
            margin-bottom: 20px;
          }
          .toolbar {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(var(--button-height), var(--button-height)));
            gap: 10px;
          }
          button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
          }
          button:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .icon-btn {
            width: var(--button-height);
            height: var(--button-height);
            padding: 10px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            gap: 8px;
          }
          .icon-btn .codicon {
            font-size: ${iconSize};
            line-height: 1;
          }
          .btn-label {
            font-size: ${btnLabelSize};
            text-align: center;
            line-height: 1;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <h3>General</h3>
          <div class="toolbar">
            <button class="icon-btn" title="Repair cache" data-command="multi-module-flutter-tools.cacheRepair">
              <i class="codicon codicon-wrench"></i>
              <span class="btn-label">Repair Cache</span>
            </button>
            <button class="icon-btn" title="Clean cache" data-command="multi-module-flutter-tools.cacheClean">
              <i class="codicon codicon-trash"></i>
              <span class="btn-label">Clean Cache</span>
            </button>
          </div>
        </div>

        <div class="section">
          <h3>Workspace</h3>
          <div class="toolbar">
            <button class="icon-btn" title="Clean workspaces" data-command="multi-module-flutter-tools.cleanWorkspaces">
              <i class="codicon codicon-folder"></i>
              <span class="btn-label">Clean</span>
            </button>
            <button class="icon-btn" title="Pub get" data-command="multi-module-flutter-tools.pubGetAll">
              <i class="codicon codicon-cloud-download"></i>
              <span class="btn-label">Pub Get</span>
            </button>
            <button class="icon-btn" title="Pub upgrade" data-command="multi-module-flutter-tools.pubUpgradeAll">
              <i class="codicon codicon-arrow-up"></i>
              <span class="btn-label">Pub Upgrade</span>
            </button>
            <button class="icon-btn" title="Pub outdated" data-command="multi-module-flutter-tools.pubOutdatedAll">
              <i class="codicon codicon-graph"></i>
              <span class="btn-label">Outdated</span>
            </button>
          </div>
        </div>

        <div class="section">
          <h3>Git</h3>
          <div class="toolbar">
            <button class="icon-btn" title="Revert pubspec.yaml" data-command="multi-module-flutter-tools.revertPubspec">
              <i class="codicon codicon-discard"></i>
              <span class="btn-label">Revert</span>
            </button>
            <button class="icon-btn" title="Pull/update all" data-command="multi-module-flutter-tools.pullUpdateAll">
              <i class="codicon codicon-repo-sync"></i>
              <span class="btn-label">Pull</span>
            </button>
            <button class="icon-btn" title="Change branch" data-command="multi-module-flutter-tools.changeBranchAll">
              <i class="codicon codicon-git-branch"></i>
              <span class="btn-label">Branch</span>
            </button>
          </div>
        </div>

        <div class="section">
          <h3>Helpers</h3>
          <div class="toolbar">
            <button class="icon-btn" title="Use local dependencies" data-command="multi-module-flutter-tools.depsToLocal">
              <i class="codicon codicon-file-symlink-file"></i>
              <span class="btn-label">Local Deps</span>
            </button>
            <button class="icon-btn" title="Run format, analyze and tests" data-command="multi-module-flutter-tools.runChecks">
              <i class="codicon codicon-checklist"></i>
              <span class="btn-label">Checks</span>
            </button>
          </div>
        </div>

        <div class="section">
          <h3>Custom</h3>
          <div class="toolbar">
            <button class="icon-btn" title="Run a custom command" data-command="multi-module-flutter-tools.runCustomAll">
              <i class="codicon codicon-terminal"></i>
              <span class="btn-label">Run Cmd</span>
            </button>
          </div>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();

          document.querySelectorAll('button[data-command]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              if (command) {
                vscode.postMessage({ type: 'runCommand', command });
              }
            });
          });
        </script>
      </body>
      </html>`;
  }
}
