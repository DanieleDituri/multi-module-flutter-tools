export const COMMANDS = {
  CACHE_REPAIR: "multi-module-flutter-tools.cacheRepair",
  CACHE_CLEAN: "multi-module-flutter-tools.cacheClean",
  CLEAN_WORKSPACES: "multi-module-flutter-tools.cleanWorkspaces",
  PUB_GET_ALL: "multi-module-flutter-tools.pubGetAll",
  PUB_UPGRADE_ALL: "multi-module-flutter-tools.pubUpgradeAll",
  PUB_OUTDATED_ALL: "multi-module-flutter-tools.pubOutdatedAll",
  REVERT_PUBSPEC: "multi-module-flutter-tools.revertPubspec",
  PULL_UPDATE_ALL: "multi-module-flutter-tools.pullUpdateAll",
  DEPS_TO_LOCAL: "multi-module-flutter-tools.depsToLocal",
  CHANGE_BRANCH_ALL: "multi-module-flutter-tools.changeBranchAll",
  RUN_CHECKS: "multi-module-flutter-tools.runChecks",
  RUN_CUSTOM_ALL: "multi-module-flutter-tools.runCustomAll",
  BUILD_RUNNER_CHECKS: "multi-module-flutter-tools.buildRunnerChecks",
  FIXED_SERIES: "multi-module-flutter-tools.fixedSeries",
  SETUP_LOCAL_RPS: "multi-module-flutter-tools.setupLocalRps",
} as const;

export const COMMAND_TITLES = {
  CACHE_REPAIR: "Repair Cache",
  CACHE_CLEAN: "Clean Cache",
  CLEAN_WORKSPACES: "Clean Workspaces",
  PUB_GET_ALL: "Pub Get",
  PUB_UPGRADE_ALL: "Pub Upgrade",
  PUB_OUTDATED_ALL: "Pub Outdated",
  REVERT_PUBSPEC: "Revert pubspec.yaml",
  PULL_UPDATE_ALL: "Pull/Update",
  DEPS_TO_LOCAL: "Use Local Dependencies",
  CHANGE_BRANCH_ALL: "Change Branch",
  RUN_CHECKS: "Run Checks",
  RUN_CUSTOM_ALL: "Run Custom Command",
  BUILD_RUNNER_CHECKS: "Build Runner + Analyze + Test",
  FIXED_SERIES: "Fixed Series",
  SETUP_LOCAL_RPS: "Setup Local (rps)",
} as const;

export const ERROR_MESSAGES = {
  // Git errors
  GIT_CHECKOUT_FAILED: (branch: string) =>
    `Failed to checkout branch "${branch}". Check if the branch exists.`,
  GIT_STASH_FAILED: "Failed to stash changes. Make sure git is installed.",
  GIT_PULL_FAILED: "Failed to pull changes. Check your network connection.",
  GIT_CLONE_FAILED: "Failed to clone repository. Check the repository URL.",

  // File errors
  FILE_NOT_FOUND: (path: string) =>
    `File not found: ${path}. Make sure the file exists.`,
  FILE_READ_ERROR: (path: string, error: string) =>
    `Cannot read ${path}: ${error}. Check file permissions.`,
  FILE_WRITE_ERROR: (path: string, error: string) =>
    `Cannot write to ${path}: ${error}. Check file permissions.`,
  PUBSPEC_NOT_FOUND: (module: string) =>
    `pubspec.yaml not found in "${module}". Is this a valid Flutter module?`,
  PUBSPEC_PARSE_ERROR: (module: string) =>
    `Failed to parse pubspec.yaml in "${module}". The file might be corrupted.`,

  // Flutter/Dart errors
  FLUTTER_NOT_FOUND: "Flutter SDK not found. Install Flutter or add it to PATH.",
  DART_NOT_FOUND: "Dart SDK not found. Install Dart or add it to PATH.",
  FLUTTER_VERSION_MISMATCH: "Flutter version mismatch. Update your SDK.",

  // Network errors
  CONNECTION_TIMEOUT: "Connection timeout. Check your network connection.",
  DNS_RESOLUTION_FAILED: "DNS resolution failed. Check your network connection.",

  // Command errors
  COMMAND_NOT_FOUND: (command: string) =>
    `Command "${command}" not found. Make sure it's installed.`,
  COMMAND_EXECUTION_FAILED: (command: string, exitCode: number) =>
    `Command "${command}" failed with exit code ${exitCode}.`,
  COMMAND_TIMEOUT: "Command timeout. The operation took too long.",

  // Extension errors
  NO_FLUTTER_MODULES: "No Flutter modules found in your workspace.",
  NO_WORKSPACE: "No workspace folders found.",
  NO_PROJECTS_SELECTED: "No projects selected for the operation.",
  INVALID_CONFIGURATION: (setting: string) =>
    `Invalid configuration for "${setting}". Check your settings.`,

  // Operation errors
  OPERATION_CANCELLED: "Operation cancelled by user.",
  OPERATION_FAILED: (operation: string) =>
    `${operation} failed. Check the output for details.`,
  OPERATION_PARTIALLY_FAILED: (operation: string, succeeded: number, failed: number) =>
    `${operation} completed: ${succeeded} succeeded, ${failed} failed. See output for details.`,
} as const;

export const SUCCESS_MESSAGES = {
  CACHE_REPAIRED: "Pub cache repaired successfully.",
  CACHE_CLEANED: "Pub cache cleaned successfully.",
  WORKSPACES_CLEANED: "All workspaces cleaned successfully.",
  PACKAGES_FETCHED: "Packages fetched successfully.",
  PACKAGES_UPGRADED: "Packages upgraded successfully.",
  PUBSPEC_REVERTED: "pubspec.yaml reverted successfully.",
  BRANCH_CHANGED: (branch: string) =>
    `Successfully changed to branch "${branch}".`,
  DEPENDENCIES_CONVERTED: "Dependencies converted to local paths.",
  CHECKS_COMPLETED: "All checks completed successfully.",
  BUILD_RUNNER_COMPLETED: "Build runner, analysis, and tests completed.",
  FIXED_SERIES_COMPLETED: "Complete setup series finished.",
  RPS_SETUP_COMPLETED: "RPS setup completed successfully.",
  CUSTOM_COMMAND_COMPLETED: "Custom command completed successfully.",

  // Generic success
  OPERATION_COMPLETED: (operation: string, count: number) =>
    `${operation} completed on ${count} ${count === 1 ? "module" : "modules"}.`,
  OPERATION_COMPLETED_WITH_STATS: (operation: string, succeeded: number, total: number, duration: number) =>
    `${operation} completed: ${succeeded}/${total} succeeded in ${duration.toFixed(1)}s.`,
} as const;

export const INFO_MESSAGES = {
  DISCOVERING_PROJECTS: "Discovering Flutter projects...",
  PROCESSING_PROJECT: (name: string) => `Processing: ${name}`,
  RUNNING_COMMAND: (command: string) => `Running: ${command}`,
  WAITING_FOR_USER_INPUT: "Waiting for user input...",
} as const;

export const WARNING_MESSAGES = {
  NO_CHANGES: (operation: string) => `${operation}: No changes detected.`,
  UNCOMMITTED_CHANGES: (module: string) =>
    `Warning: ${module} has uncommitted changes.`,
  SKIPPING_MODULE: (module: string, reason: string) =>
    `Skipping ${module}: ${reason}`,
  PARTIAL_SUCCESS: (succeeded: number, failed: number) =>
    `Operation partially completed: ${succeeded} succeeded, ${failed} failed.`,
  TIMEOUT_WARNING: (seconds: number) =>
    `Operation is taking longer than expected (${seconds}s). This might be due to network issues.`,
} as const;
