# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/goddivor/seticon-cli/compare/v1.0.1...v1.1.0) (2026-05-30)


### Features

* **cli:** default help to english with persisted --lang option (en/fr) ([6ecc3dc](https://github.com/goddivor/seticon-cli/commit/6ecc3dc741bc067002d4ffcb83326550a5007439))


### Bug Fixes

* **windows:** copy icon locally into the folder for instant Properties display ([30723fb](https://github.com/goddivor/seticon-cli/commit/30723fba6010f17095e9d32680a0ca65aea6164b))
* **windows:** drop ie4uinit refresh call (adds latency without reliably refreshing) ([89a70f8](https://github.com/goddivor/seticon-cli/commit/89a70f83da0fa39c927dea922df7391e7dbf728b))
* **windows:** reference the absolute store path in desktop.ini ([3636145](https://github.com/goddivor/seticon-cli/commit/363614528f4d1d609518f1aac5b4aedceaa57c4a)), closes [#1](https://github.com/goddivor/seticon-cli/issues/1) [#2](https://github.com/goddivor/seticon-cli/issues/2) [#3](https://github.com/goddivor/seticon-cli/issues/3)

## [1.0.1] - 2026-05-29

Maintenance release — metadata fixes only, no functional changes.

### Changed

- Corrected `repository`, `bugs` and `homepage` URLs to point to
  `goddivor/seticon-cli` (were still pointing to the old `goddivor/CmdProject`
  monorepo).
- Updated README links accordingly.

## [1.0.0] - 2026-05-29

Initial standalone release, extracted from the
[CmdProject](https://github.com/goddivor/CmdProject) monorepo.

### Added

- Cross-platform CLI to change folder icons on Windows, macOS and Linux.
- Windows support via `desktop.ini` with hidden/system/readonly attributes.
- macOS support via NSWorkspace (JXA / `osascript`).
- Linux support via `gio` metadata (GNOME) and `.directory` files (KDE),
  applied simultaneously for mixed environments.
- Automatic PNG/JPG to multi-size ICO conversion on Windows
  (via `sharp` + `png-to-ico`).

[1.0.1]: https://github.com/goddivor/seticon-cli/releases/tag/v1.0.1
[1.0.0]: https://github.com/goddivor/seticon-cli/releases/tag/v1.0.0
