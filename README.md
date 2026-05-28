# Multi Module Flutter Tools

Run Flutter and Dart maintenance commands across all Flutter modules in your VS Code workspace. Designed for mono-module and multi-root workspaces where you need consistent tooling across many apps and packages.

## Features

- **Cache tools**: repair or force-clean Flutter/Dart pub caches
- **Package tools**: clean, pub get/upgrade, outdated checks across all modules
- **Git helpers**: revert pubspec.yaml, pull with rebase, change branch across all modules
- **Local dependencies**: convert dependencies to local `path:` references in pubspec.yaml
- **Checks**: format, build_runner, analyze and test on a single module — non-build failures (analyze warnings) are reported but don't block tests
- **Build Runner**: build_runner + analyze + test on multiple selected modules — opens a dedicated terminal for test output
- **Fixed Series**: run the full setup sequence (clean cache → clean → local deps → pub get) in one click
- **Custom command**: run any shell command across all modules
- **Real-time output**: all commands stream output live to the Output panel as they run
- **FVM support**: optionally prefix all flutter/dart commands with `fvm`

## Quick Start

1. Open a workspace that contains Flutter modules.
2. Click **Flutter Tools** in the Activity Bar.
3. Use the dashboard to run multi-module actions.

## Dashboard

The sidebar is organised into five sections:

### Cache
| Button | What it does |
|--------|-------------|
| **Repair Cache** | `flutter pub cache repair` + `dart pub cache repair` in every workspace root |
| **Clean Cache** | `flutter pub cache clean --force` + `dart pub cache clean --force` in every workspace root |

### Packages
| Button | What it does |
|--------|-------------|
| **Clean All** | `flutter clean` + removes `pubspec.lock` in every module |
| **Pub Get** | `flutter pub get` in every module |
| **Pub Upgrade** | `flutter pub upgrade` in every module |
| **Outdated** | `flutter pub outdated` in every module |

### Git
| Button | What it does |
|--------|-------------|
| **Revert pubspec.yaml** | `git checkout pubspec.yaml` in every module |
| **Pull & Update** | Stash → pull `--rebase` → restore stash in every module |
| **Change Branch** | Prompt for branch name, then `git checkout <branch>` in every module |

### Analysis
| Button | What it does |
|--------|-------------|
| **Use Local Deps** | Converts matching dependencies to `path: ../<package>` in every module's pubspec.yaml |
| **Run Checks** | `dart format` → `build_runner clean` → `build_runner build` → `flutter analyze` on a single selected module, then opens a terminal for `flutter test` |
| **Build Runner** | `build_runner build` → `flutter analyze` on multiple selected modules, then opens a single terminal running `flutter test` for every module that passed |

### Run
| Button | What it does |
|--------|-------------|
| **Fixed Series** | Runs in sequence: **Clean Cache → Clean All → Use Local Deps → Pub Get** |
| **Custom Command** | Prompts for a shell command and runs it in every module |

## Commands

All actions are also available from the Command Palette (`Cmd+Shift+P`):

- `Multi-Module Flutter: Repair Cache`
- `Multi-Module Flutter: Clean Cache`
- `Multi-Module Flutter: Clean Workspaces`
- `Multi-Module Flutter: Pub Get (All)`
- `Multi-Module Flutter: Pub Upgrade (All)`
- `Multi-Module Flutter: Pub Outdated (All)`
- `Multi-Module Flutter: Revert pubspec.yaml (All)`
- `Multi-Module Flutter: Pull/Update (All)`
- `Multi-Module Flutter: Use Local Dependencies`
- `Multi-Module Flutter: Change Branch (All)`
- `Multi-Module Flutter: Run Checks`
- `Multi-Module Flutter: Build Runner + Analyze + Test (Selected)`
- `Multi-Module Flutter: Fixed Series (Clean Cache → Clean → Local Deps → Pub Get)`
- `Multi-Module Flutter: Run Custom Command (All)`

## Settings

Configure under **Settings → Extensions → Multi Module Flutter Tools**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `multiModuleFlutter.scanNested` | boolean | `true` | Scan workspace folders recursively for Flutter modules |
| `multiModuleFlutter.maxDepth` | number | `2` | Max directory depth to scan (0 = root only) |
| `multiModuleFlutter.excludeFolders` | array | `[node_modules, .git, ...]` | Folder names to skip during scanning |
| `multiModuleFlutter.toolbarButtonSize` | number | `75` | Scales the sidebar icon size |
| `multiModuleFlutter.useFvm` | boolean | `false` | Prefix all flutter/dart commands with `fvm` |

## Requirements

- Flutter and Dart available in `PATH` (or enable `multiModuleFlutter.useFvm`).
- Git available for git-related commands.

## Notes

- Module discovery is based on `pubspec.yaml` presence.
- `flutter analyze` warnings (e.g. path dependencies after using Local Deps) are shown in the output but do not stop the pipeline — only hard build failures do.
- Tests always open in a dedicated VS Code terminal so you see Flutter's native coloured output and test summary.

## Changelog

### 1.0.0
- First stable release
- New **Build Runner** command: runs `build_runner build`, `flutter analyze`, and `flutter test` on multiple selected modules
- New **Fixed Series** command: one-click sequence of Clean Cache → Clean → Local Deps → Pub Get
- Tests open in a dedicated terminal with Flutter's native coloured output
- All commands stream output in real-time (replaced buffered `exec` with `spawn`)
- Output panel opens automatically when a command starts
- Cancelling a command kills the running process immediately
- `flutter analyze` warnings no longer stop the pipeline (only build failures do)
- Sidebar redesigned: list layout with icon + title + description per action

### 0.2.0
- Sidebar webview with icon buttons
- Configurable button size (`toolbarButtonSize`)
- FVM support (`useFvm`)
- Progress notifications with cancellation

### 0.1.0
- Initial release with core multi-module commands
