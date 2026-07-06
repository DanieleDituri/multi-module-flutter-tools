import * as vscode from "vscode";

export function uiScaleMultiplier(scale: string): number {
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

export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export abstract class BaseWebviewProvider implements vscode.WebviewViewProvider {
  protected _extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration("multiModuleFlutter.uiScale")) {
          webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        }
      },
    );

    webviewView.onDidDispose(() => configChangeListener.dispose());

    webviewView.webview.onDidReceiveMessage(async (data: { type: string; command?: string }) => {
      if (data.type === "runCommand" && data.command) {
        try {
          await vscode.commands.executeCommand(data.command);
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to execute command: ${error?.message || "Unknown error"}`
          );
        }
      }
    });
  }

  protected abstract getHtmlForWebview(webview: vscode.Webview): string;

  protected getCodiconsUri(webview: vscode.Webview): vscode.Uri {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "dist",
        "codicons",
        "codicon.css",
      ),
    );
  }
}
