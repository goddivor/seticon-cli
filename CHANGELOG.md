# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
