import * as vscode from "vscode";

export class MultiModuleViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "multi-module-flutter-view";

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _output: vscode.OutputChannel,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration("multiModuleFlutter.toolbarButtonSize")) {
          webviewView.webview.html = this._getHtmlForWebview(
            webviewView.webview,
          );
        }
      },
    );

    webviewView.onDidDispose(() => {
      configChangeListener.dispose();
    });

    webviewView.webview.onDidReceiveMessage(async (data: { type: string; command?: string }) => {
      if (data.type === "runCommand" && data.command) {
        await vscode.commands.executeCommand(data.command);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "dist",
        "codicons",
        "codicon.css",
      ),
    );

    const config = vscode.workspace.getConfiguration("multiModuleFlutter");
    const buttonSize = Math.max(40, config.get<number>("toolbarButtonSize", 75));
    const iconSize = `${Math.max(14, Math.min(22, Math.round(buttonSize * 0.22)))}px`;

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
          body {
            padding: 0;
            margin: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
          }

          .section {
            padding: 8px 0 4px;
          }
          .section + .section {
            border-top: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
          }

          .section-header {
            font-size: 0.72em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.5;
            padding: 0 12px 4px;
          }

          .list-btn {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 5px 12px;
            gap: 10px;
            text-align: left;
            background: transparent;
            color: var(--vscode-foreground);
            border: none;
            border-radius: 0;
            cursor: pointer;
            box-sizing: border-box;
          }
          .list-btn:hover {
            background: var(--vscode-list-hoverBackground);
          }
          .list-btn:active {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
          }

          .btn-icon {
            font-size: ${iconSize};
            width: 20px;
            text-align: center;
            flex-shrink: 0;
            opacity: 0.85;
          }

          .btn-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
          }
          .btn-title {
            font-size: 0.9em;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .btn-desc {
            font-size: 0.77em;
            opacity: 0.55;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      </head>
      <body>

        <div class="section">
          <div class="section-header">Cache</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.cacheRepair">
            <i class="codicon codicon-wrench btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Repair Cache</span>
              <span class="btn-desc">flutter &amp; dart pub cache repair</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.cacheClean">
            <i class="codicon codicon-trash btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Clean Cache</span>
              <span class="btn-desc">flutter &amp; dart pub cache clean --force</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Packages</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.cleanWorkspaces">
            <i class="codicon codicon-clear-all btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Clean All</span>
              <span class="btn-desc">flutter clean on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubGetAll">
            <i class="codicon codicon-cloud-download btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Pub Get</span>
              <span class="btn-desc">flutter pub get on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubUpgradeAll">
            <i class="codicon codicon-arrow-circle-up btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Pub Upgrade</span>
              <span class="btn-desc">flutter pub upgrade on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubOutdatedAll">
            <i class="codicon codicon-tag btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Outdated</span>
              <span class="btn-desc">List outdated packages in every module</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Git</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.revertPubspec">
            <i class="codicon codicon-discard btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Revert pubspec.yaml</span>
              <span class="btn-desc">Discard pubspec.yaml changes in every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pullUpdateAll">
            <i class="codicon codicon-repo-sync btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Pull &amp; Update</span>
              <span class="btn-desc">Stash, pull --rebase, restore in every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.changeBranchAll">
            <i class="codicon codicon-git-branch btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Change Branch</span>
              <span class="btn-desc">Checkout a branch in every module</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Analysis</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.depsToLocal">
            <i class="codicon codicon-link btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Use Local Deps</span>
              <span class="btn-desc">Switch deps to local path in pubspec.yaml</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.runChecks">
            <i class="codicon codicon-checklist btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Run Checks</span>
              <span class="btn-desc">Format, build_runner, analyze, test — one module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.buildRunnerChecks">
            <i class="codicon codicon-gear btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Build Runner</span>
              <span class="btn-desc">Build_runner, analyze, test — selected modules</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Run</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.fixedSeries">
            <i class="codicon codicon-run-all btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Fixed Series</span>
              <span class="btn-desc">Clean cache → clean → local deps → pub get</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.runCustomAll">
            <i class="codicon codicon-terminal btn-icon"></i>
            <div class="btn-text">
              <span class="btn-title">Custom Command</span>
              <span class="btn-desc">Run any shell command on every module</span>
            </div>
          </button>
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

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
