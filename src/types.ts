export interface ProjectInfo {
  name: string;
  path: string;
}

export interface OperationStats {
  successCount: number;
  failureCount: number;
  totalCount: number;
  durationMs: number;
  cancelled: boolean;
  errors: Array<{ module: string; message: string }>;
}

export interface CommandResult {
  ok: boolean;
  message?: string;
  error?: Error;
  stats?: OperationStats;
}

export interface NotificationConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  count?: number;
  total?: number;
  duration?: number;
}
