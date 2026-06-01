# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0](https://github.com/goddivor/seticon-cli/compare/v1.1.0...v1.2.0) (2026-06-01)


### Features

* **cli:** add short aliases for overlay options; document overlay in help and README ([fafeb95](https://github.com/goddivor/seticon-cli/commit/fafeb959a545616874cedcce369c6d29f245a4c6))
* **cli:** warn on unknown options; document --text/--text-color in help and README ([22b3a6e](https://github.com/goddivor/seticon-cli/commit/22b3a6e83cfab4fd49ca08912376363aed5fbd2a))
* folder overlay generator (image/text, color variants, zoom) ([e881051](https://github.com/goddivor/seticon-cli/commit/e881051bbddccb74b299a48c4759b862463e4fbc))
* **formats:** support ico, png, jpg, jpeg, bmp, tif, tiff, webp, svg as input ([ebd886e](https://github.com/goddivor/seticon-cli/commit/ebd886eae96292a32bd75c4d833c852a7b67222e))
* **generate:** add folder icon composition engine (sharp) ([513df85](https://github.com/goddivor/seticon-cli/commit/513df85ae5217207307fad08e7f30988aea71c87))
* **overlay:** add text overlay (--text / -t, --text-color / -tc) ([7e02a44](https://github.com/goddivor/seticon-cli/commit/7e02a446f518064d3d6f47d80dac0f31f08cb484))
* **overlay:** apply --icon-color on Linux too ([0e6b0ba](https://github.com/goddivor/seticon-cli/commit/0e6b0ba58269588b19e76790fe396f9e2bbf3cc3))
* **overlay:** lay a user image over an OS folder base ([bd45f62](https://github.com/goddivor/seticon-cli/commit/bd45f6286c1844fe369cac6cbd843d1b7879950a))
* **overlay:** read the machine folder icon on Linux + color presets/hex ([94677e0](https://github.com/goddivor/seticon-cli/commit/94677e03388b40727f362dce651bd79c97e56ffc))
* **reset:** add a reset command to restore a folder's default icon ([c7572d7](https://github.com/goddivor/seticon-cli/commit/c7572d76fdc8a219fc50f075926c23504be555b2))
* **reset:** restore a folder's default icon ([e90d10a](https://github.com/goddivor/seticon-cli/commit/e90d10a823f8f73bef9ef9ec2f36efcc42a1248e))
* support ico, png, jpg, jpeg, bmp, tif, tiff, webp, svg as input ([932cf91](https://github.com/goddivor/seticon-cli/commit/932cf9140432146a39ac794bcd8c92831c49ae59))
* **windows:** drop bundled Windows asset; Windows is native-only ([3910226](https://github.com/goddivor/seticon-cli/commit/3910226c036a187231c1be76701019d6ce884c06))
* **windows:** native folder icon via ico-extract; Windows/Linux are native-only ([ec19d14](https://github.com/goddivor/seticon-cli/commit/ec19d14ed7b38eb2caa96f8adf256e2708412061))
* **windows:** use the OS native folder icon via ico-extract (cached) ([ea404e8](https://github.com/goddivor/seticon-cli/commit/ea404e86847543ed27ae1603d6fb46abdd2dd599))


### Bug Fixes

* **cli:** don't consume a flag as the positional icon argument ([9a88823](https://github.com/goddivor/seticon-cli/commit/9a888238f8e03ba8d26011b8a31419da73e83f90))
* **overlay:** await processIconChange so the temp file outlives conversion ([18ad2fc](https://github.com/goddivor/seticon-cli/commit/18ad2fc3e52e2d79d76d8d2fae6e521de58c619a))
* **overlay:** icon-color works with the default theme color on Linux ([1b7dd83](https://github.com/goddivor/seticon-cli/commit/1b7dd83073b02e9589d6a27f6135ed44336abbbe))
* **windows:** convert PNG to ICO when applying (overlay and direct) ([c14f7d7](https://github.com/goddivor/seticon-cli/commit/c14f7d715531bb8a7be85303ef0a42f9adbe7e74))

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
