# Multi Module Flutter Tools

Run Flutter and Dart maintenance commands across all Flutter modules in your VS Code workspace. Designed for mono-modules or multi-root workspaces where you need consistent tooling across many apps and packages.

## Features

- **Dashboard view** with one-click actions
- **Cache tools**: repair or clean Flutter/Dart caches
- **Workspace tools**: clean, pub get/upgrade, outdated checks
- **Git helpers**: revert pubspec.yaml, pull/update, change branches
- **Local dependencies**: convert matching dependencies to local path references
- **Checks**: run format, build_runner, analyze, and tests on a selected module
- **Custom command**: run any shell command across all modules

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
