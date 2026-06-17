# Changelog

## 1.2.0
- New **Setup Local (rps)** command in Analysis section: runs `rps setup local` in every module using the [rps](https://pub.dev/packages/rps) Dart script runner
- If `rps` is not installed, the command warns the user and offers to install it via `dart pub global activate rps`

## 1.1.0
- Sidebar icons now have a coloured badge background (VS Code button colour) for better visual hierarchy
- New `uiScale` setting replaces `toolbarButtonSize` — six named sizes: `compact` `small` `medium` `large` `x-large` (default) `xx-large`
- UI scale updates live when the setting changes

## 1.0.0
- First stable release
- New **Build Runner** command: runs `build_runner build`, `flutter analyze`, and `flutter test` on multiple selected modules
- New **Fixed Series** command: one-click sequence of Clean Cache → Clean → Local Deps → Pub Get
- Tests open in a dedicated terminal with Flutter's native coloured output
- All commands stream output in real-time (replaced buffered `exec` with `spawn`)
- Output panel opens automatically when a command starts
- Cancelling a command kills the running process immediately
- `flutter analyze` warnings no longer stop the pipeline (only build failures do)
- Sidebar redesigned: list layout with icon + title + description per action

## 0.2.0
- Sidebar webview with icon buttons
- Configurable button size (`toolbarButtonSize`)
- FVM support (`useFvm`)
- Progress notifications with cancellation

## 0.1.0
- Initial release with core multi-module commands
