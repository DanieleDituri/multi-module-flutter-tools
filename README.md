# Multi Module Flutter Tools

Run Flutter and Dart maintenance commands across all Flutter modules in your VS Code workspace. Designed for mono-modules or multi-root workspaces where you need consistent tooling across many apps and packages.

## Features

- **General tools**: repair or clean Flutter/Dart caches
- **Per-module tools**: clean, pub get/upgrade, outdated checks
- **Git helpers**: revert pubspec.yaml, pull/update, change branch
- **Local dependencies**: convert matching dependencies to local path references
- **Checks**: run format, build_runner, analyze, and tests on a selected module
- **Workspace tools**: prepare/update workspace
- **Super general**: run a custom command on every module

## Quick Start

1. Open a workspace that contains Flutter modules.
2. Click **Flutter Tools** in the Activity Bar.
3. Use the dashboard buttons to run multi-module actions.

## Commands

Available from the Command Palette:

- **Multi-Module Flutter: Repair Cache**
- **Multi-Module Flutter: Clean Cache**
- **Multi-Module Flutter: Clean Workspaces**
- **Multi-Module Flutter: Pub Get (All)**
- **Multi-Module Flutter: Pub Upgrade (All)**
- **Multi-Module Flutter: Pub Outdated (All)**
- **Multi-Module Flutter: Revert pubspec.yaml (All)**
- **Multi-Module Flutter: Pull/Update (All)**
- **Multi-Module Flutter: Use Local Dependencies**
- **Multi-Module Flutter: Change Branch (All)**
- **Multi-Module Flutter: Run Checks**
- **Multi-Module Flutter: Run Custom Command (All)**
- **Multi-Module Flutter: Prepare/Update Workspace**

## Dashboard Actions Explained

General:
- **Repair Cache**: Runs `flutter pub cache repair` and `dart pub cache repair` in each workspace root.
- **Clean Cache**: Runs `flutter pub cache clean --force` and `dart pub cache clean --force` in each workspace root.

Workspace:
- **Clean**: Runs `flutter clean` in every Flutter module and removes `pubspec.lock` if present.
- **Pub Get**: Runs `flutter pub get` in every Flutter module.
- **Pub Upgrade**: Runs `flutter pub upgrade` in every Flutter module.
- **Outdated**: Runs `flutter pub outdated` in every Flutter module.

Workspace Management:
- **Prepare**: Placeholder, not available without an explicit workflow.

Git:
- **Revert**: Reverts `pubspec.yaml` in every Flutter module (`git checkout --quiet pubspec.yaml`).
- **Pull**: Stashes local changes, pulls with rebase, then restores the stash in every module.
- **Branch**: Prompts for a branch name and checks it out in every module.

Helpers:
- **Local Deps**: Converts matching dependencies in `pubspec.yaml` to local `path: ../<package>` references.
- **Checks**: Runs `dart format`, `build_runner clean`, `build_runner build`, `flutter analyze`, `flutter test` on a selected module.

## Settings

Configure under **Settings → Extensions → Multi Module Flutter Tools**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `multiModuleFlutter.scanNested` | boolean | `true` | Scan workspace folders recursively for Flutter modules |
| `multiModuleFlutter.maxDepth` | number | `2` | Maximum directory depth to scan |
| `multiModuleFlutter.excludeFolders` | array | `[...]` | Folder names to skip during scanning |
| `multiModuleFlutter.toolbarButtonSize` | number | `75` | Height of toolbar buttons in pixels |
| `multiModuleFlutter.useFvm` | boolean | `false` | Prefix flutter/dart commands with `fvm` |

## Requirements

- Flutter and Dart available in your PATH (or enable `multiModuleFlutter.useFvm`).
- Git available for git-related helpers.

## Notes

- Module discovery is based on `pubspec.yaml`.
- Local dependency conversion replaces matching dependencies with `path: ../<package>`.
