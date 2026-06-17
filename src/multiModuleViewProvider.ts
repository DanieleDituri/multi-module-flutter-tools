import * as vscode from "vscode";

export class MultiModuleViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "multi-module-flutter-view";

  constructor(
    private readonly _extensionUri: vscode.Uri,
    _output: vscode.OutputChannel,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration("multiModuleFlutter.uiScale")) {
          webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        }
      },
    );

    webviewView.onDidDispose(() => configChangeListener.dispose());

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
    const scale = uiScaleMultiplier(
      vscode.workspace.getConfiguration("multiModuleFlutter").get<string>("uiScale", "medium"),
    );
    const iconSize = `${Math.round(17 * scale)}px`;
    const iconBoxSize = `${Math.round(30 * scale)}px`;
    const sectionHeaderSize = `${+(0.72 * scale).toFixed(3)}em`;
    const btnTitleSize = `${+(0.9 * scale).toFixed(3)}em`;
    const btnDescSize = `${+(0.77 * scale).toFixed(3)}em`;

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
            color: var(--vscode-foreground);
          }

          .section {
            padding: 8px 0 4px;
          }
          .section + .section {
            border-top: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
          }

          .section-header {
            font-size: ${sectionHeaderSize};
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
            width: ${iconBoxSize};
            height: ${iconBoxSize};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 6px;
          }
          .btn-icon .codicon {
            font-size: ${iconSize};
            line-height: 1;
          }

          .btn-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
          }
          .btn-title {
            font-size: ${btnTitleSize};
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .btn-desc {
            font-size: ${btnDescSize};
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
            <span class="btn-icon"><i class="codicon codicon-wrench"></i></span>
            <div class="btn-text">
              <span class="btn-title">Repair Cache</span>
              <span class="btn-desc">flutter &amp; dart pub cache repair</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.cacheClean">
            <span class="btn-icon"><i class="codicon codicon-trash"></i></span>
            <div class="btn-text">
              <span class="btn-title">Clean Cache</span>
              <span class="btn-desc">flutter &amp; dart pub cache clean --force</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Packages</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.cleanWorkspaces">
            <span class="btn-icon"><i class="codicon codicon-clear-all"></i></span>
            <div class="btn-text">
              <span class="btn-title">Clean All</span>
              <span class="btn-desc">flutter clean on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubGetAll">
            <span class="btn-icon"><i class="codicon codicon-cloud-download"></i></span>
            <div class="btn-text">
              <span class="btn-title">Pub Get</span>
              <span class="btn-desc">flutter pub get on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubUpgradeAll">
            <span class="btn-icon"><i class="codicon codicon-arrow-circle-up"></i></span>
            <div class="btn-text">
              <span class="btn-title">Pub Upgrade</span>
              <span class="btn-desc">flutter pub upgrade on every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pubOutdatedAll">
            <span class="btn-icon"><i class="codicon codicon-tag"></i></span>
            <div class="btn-text">
              <span class="btn-title">Outdated</span>
              <span class="btn-desc">List outdated packages in every module</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Git</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.revertPubspec">
            <span class="btn-icon"><i class="codicon codicon-discard"></i></span>
            <div class="btn-text">
              <span class="btn-title">Revert pubspec.yaml</span>
              <span class="btn-desc">Discard pubspec.yaml changes in every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.pullUpdateAll">
            <span class="btn-icon"><i class="codicon codicon-repo-sync"></i></span>
            <div class="btn-text">
              <span class="btn-title">Pull &amp; Update</span>
              <span class="btn-desc">Stash, pull --rebase, restore in every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.changeBranchAll">
            <span class="btn-icon"><i class="codicon codicon-git-branch"></i></span>
            <div class="btn-text">
              <span class="btn-title">Change Branch</span>
              <span class="btn-desc">Checkout a branch in every module</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Analysis</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.depsToLocal">
            <span class="btn-icon"><i class="codicon codicon-link"></i></span>
            <div class="btn-text">
              <span class="btn-title">Use Local Deps</span>
              <span class="btn-desc">Switch deps to local path in pubspec.yaml</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.setupLocalRps">
            <span class="btn-icon"><i class="codicon codicon-package"></i></span>
            <div class="btn-text">
              <span class="btn-title">Setup Local (rps)</span>
              <span class="btn-desc">rps setup local in every module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.runChecks">
            <span class="btn-icon"><i class="codicon codicon-checklist"></i></span>
            <div class="btn-text">
              <span class="btn-title">Run Checks</span>
              <span class="btn-desc">Format, build_runner, analyze, test — one module</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.buildRunnerChecks">
            <span class="btn-icon"><i class="codicon codicon-gear"></i></span>
            <div class="btn-text">
              <span class="btn-title">Build Runner</span>
              <span class="btn-desc">Build_runner, analyze, test — selected modules</span>
            </div>
          </button>
        </div>

        <div class="section">
          <div class="section-header">Run</div>
          <button class="list-btn" data-command="multi-module-flutter-tools.fixedSeries">
            <span class="btn-icon"><i class="codicon codicon-run-all"></i></span>
            <div class="btn-text">
              <span class="btn-title">Fixed Series</span>
              <span class="btn-desc">Clean cache → clean → local deps → pub get</span>
            </div>
          </button>
          <button class="list-btn" data-command="multi-module-flutter-tools.runCustomAll">
            <span class="btn-icon"><i class="codicon codicon-terminal"></i></span>
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

function uiScaleMultiplier(scale: string): number {
  switch (scale) {
    case "compact": return 0.8;
    case "small": return 0.9;
    case "medium": return 1;
    case "large": return 1.1;
    case "x-large": return 1.25;
    case "xx-large": return 1.5;
    default: return 1.25;
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
