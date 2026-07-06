import * as vscode from "vscode";
import { NotificationConfig, OperationStats } from "./types.js";

export class NotificationManager {
  private static readonly EMOJI = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  notifySuccess(config: NotificationConfig): void {
    this.notify(config, "success");
  }

  notifyError(config: NotificationConfig): void {
    this.notify(config, "error");
  }

  notifyWarning(config: NotificationConfig): void {
    this.notify(config, "warning");
  }

  notifyInfo(config: NotificationConfig): void {
    this.notify(config, "info");
  }

  notifyCompletion(operationName: string, stats: OperationStats): void {
    const { successCount, failureCount, totalCount, durationMs, cancelled } = stats;
    const duration = (durationMs / 1000).toFixed(1);

    if (cancelled) {
      this.notifyWarning({
        title: operationName,
        message: `Operation cancelled by user (${duration}s)`,
        type: "warning",
      });
      return;
    }

    if (failureCount === 0) {
      const countText = totalCount === 1 ? "1 module" : `${totalCount} modules`;
      this.notifySuccess({
        title: operationName,
        message: `Completed successfully on ${countText} (${duration}s)`,
        type: "success",
        count: successCount,
        total: totalCount,
        duration: durationMs,
      });
    } else if (successCount > 0) {
      this.notifyWarning({
        title: operationName,
        message: `Partially completed: ${successCount}/${totalCount} succeeded (${duration}s)`,
        type: "warning",
        count: successCount,
        total: totalCount,
        duration: durationMs,
      });
    } else {
      this.notifyError({
        title: operationName,
        message: `Failed on all ${totalCount} modules (${duration}s)`,
        type: "error",
        total: totalCount,
        duration: durationMs,
      });
    }
  }

  private notify(config: NotificationConfig, type: "success" | "error" | "warning" | "info"): void {
    const emoji = NotificationManager.EMOJI[type];
    const message = `${emoji} ${config.message}`;

    switch (type) {
      case "success":
        vscode.window.showInformationMessage(message);
        break;
      case "error":
        vscode.window.showErrorMessage(message);
        break;
      case "warning":
        vscode.window.showWarningMessage(message);
        break;
      case "info":
        vscode.window.showInformationMessage(message);
        break;
    }
  }
}
