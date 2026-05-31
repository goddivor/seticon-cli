<div align="center">

# seticon

[![JavaScript](https://img.shields.io/badge/JavaScript-323330?logo=javascript&logoColor=F7DF1E&style=flat)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Release](https://img.shields.io/github/v/release/goddivor/seticon-cli?logo=github&logoColor=fff&label=Release&labelColor=333&color=148ACF&style=flat)](https://github.com/goddivor/seticon-cli/releases)
[![License](https://img.shields.io/npm/l/seticon-cli?logo=github&logoColor=fff&label=License&labelColor=333&color=2BB24C&style=flat)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-F47C00?logo=contributorcovenant&logoColor=fff&labelColor=333&style=flat)](./.github/CODE_OF_CONDUCT.md)
[![Downloads](https://img.shields.io/npm/dy/seticon-cli?logo=npm&logoColor=CB3837&label=Downloads&labelColor=333&color=CB3837&style=flat)](https://www.npmjs.com/package/seticon-cli)

[![Stars](https://img.shields.io/github/stars/goddivor/seticon-cli?logo=github&logoColor=fff&label=Stars&labelColor=333&color=E3B341&style=flat)](https://github.com/goddivor/seticon-cli/stargazers)
[![Forks](https://img.shields.io/github/forks/goddivor/seticon-cli?logo=github&logoColor=fff&label=Forks&labelColor=333&color=8957E5&style=flat)](https://github.com/goddivor/seticon-cli/network/members)
[![Watchers](https://img.shields.io/github/watchers/goddivor/seticon-cli?logo=github&logoColor=fff&label=Watchers&labelColor=333&color=1F6FEB&style=flat)](https://github.com/goddivor/seticon-cli/watchers)
[![Contributors](https://img.shields.io/github/contributors/goddivor/seticon-cli?logo=github&logoColor=fff&label=Contributors&labelColor=333&color=DB61A2&style=flat)](https://github.com/goddivor/seticon-cli/graphs/contributors)
[![Open issues](https://img.shields.io/github/issues/goddivor/seticon-cli?logo=github&logoColor=fff&label=Issues&labelColor=333&color=3FB950&style=flat)](https://github.com/goddivor/seticon-cli/issues)

Cross-platform CLI to change folder icons on **Windows**, **macOS** and **Linux**.

Accepts common image formats and automatically converts them to a multi-size
ICO, then applies the icon using the right mechanism for each desktop environment.

</div>

## 🎖️ Features

- **Cross-platform** — Windows, macOS, Linux (GNOME and KDE)
- **Many input formats** — `ico`, `png`, `jpg`, `jpeg`, `bmp`, `tif`, `tiff`, `webp`, `svg`
- **Automatic ICO conversion** built in (multi-size: 16, 32, 48, 64, 128, 256); `png` and `ico` are used as-is
- **Overlay mode** — lay your image over a real folder icon, with color variants and zoom
- **Content-addressed icon cache** with deduplication (same image reused, never re-converted)
- **No admin / sudo required** for the icon change itself
- **Detects the OS** and applies the correct mechanism automatically:
  - Windows → `desktop.ini` + `attrib +H +S +R`
  - macOS   → `NSWorkspace.setIcon` via `osascript` (Finder)
  - Linux   → `gio set metadata::custom-icon` (GNOME) + `.directory` (KDE)

## 📋 Requirements

- Node.js >= 18.17.0
- Windows: works out of the box
- macOS: Finder automation permission (prompted on first run)
- Linux: `gio` (part of `glib2`, present by default on most distros)

## 📦 Installation

```bash
# npm
npm i seticon-cli

# yarn
yarn add seticon-cli

# pnpm
pnpm add seticon-cli
```

Or install it globally to use the `seticon` command anywhere:

```bash
# npm
npm i -g seticon-cli

# yarn
yarn global add seticon-cli

# pnpm
pnpm add -g seticon-cli
```

## ⚙️ Usage

```bash
# Set a folder icon (any image is auto-converted to ICO)
seticon set -f "./MyFolder" -i "./icon.png"
seticon set -f "./MyFolder" -i "./photo.webp"

# Shorthand: positional arguments, no flags needed
seticon "./MyFolder" "./icon.png"
seticon convert "./image.jpg" "./icon.ico"

# Long options also work
seticon set --folder "Documents" --icon "logo.svg"

# Convert an image to ICO without setting an icon
seticon convert -i "./image.bmp" -o "./icon.ico"

# Pick specific sizes for the ICO output
seticon convert --icon "photo.png" --output "icon.ico" --sizes 16,32,48

# Show the full manual
seticon --help

# Switch the interface language, remembered for next runs (en, fr)
seticon --lang fr
seticon -l en
```

### 🎨 Overlay mode

Instead of using your image directly, lay it over a real folder icon (à la
FolderArt). Add `--overlay` (`-ov`):

```bash
# Lay an image over the current OS folder, then apply it
seticon set -f "./MyFolder" -i "./logo.png" --overlay

# Pick the folder style and color, save to a file
seticon set -i "logo.svg" -o "icon.ico" --overlay --os mac --variant red

# Tint the overlay to match the folder color, and zoom it (short aliases)
seticon set -f "./Dev" -i "js.png" -ov -va blue -ic variant -z 125

# Linux uses your current icon theme; color it with a preset or a hex
seticon set -f "./Photos" -i "cam.png" -ov -va "#e67e22"
```

| Option | Alias | Values | Notes |
| ------ | ----- | ------ | ----- |
| `--overlay` | `-ov` | — | Enable overlay mode |
| `--os` | `-os` | `mac`, `windows`, `linux` | Folder style (default: current OS) |
| `--variant` | `-va` | mac/windows: variant name · linux: color preset or `#hex` | Folder color |
| `--icon-color` | `-ic` | `original`, `variant` | Keep image colors or tint to folder |
| `--zoom` | `-z` | `75`, `92`, `100`, `108`, `125` | Overlay size |

> On **Linux**, the base folder is read from your current icon theme (Adwaita,
> Yaru, Breeze…) — nothing is bundled. On **macOS/Windows**, bundled folder
> looks are used. macOS HD/flat-drive variants are not yet supported.

### 🖼️ Supported formats

| Input format                          | Behavior              |
| ------------------------------------- | --------------------- |
| `png`, `ico`                          | used as-is            |
| `jpg`, `jpeg`, `bmp`, `tif`, `tiff`, `webp`, `svg` | auto-converted to a multi-size `ico` |

Converted icons are stored once in a content-addressed cache and reused for
identical images, so the same picture is never converted twice.

### 🖥️ How the icon is applied per OS

| OS      | Mechanism                                                            |
| ------- | ------------------------------------------------------------------- |
| Windows | `desktop.ini` (absolute `IconResource`) + `attrib +H +S +R`         |
| macOS   | `NSWorkspace.setIcon` via `osascript` (Finder permission on 1st run) |
| Linux   | `gio set metadata::custom-icon` (GNOME) + `.directory` file (KDE)    |

## 🤝 Contributing

We welcome contributions of all kinds — bug reports, feature ideas, documentation
fixes and pull requests. Please read the [contributing guide](./.github/CONTRIBUTING.md)
and follow our [code of conduct](./.github/CODE_OF_CONDUCT.md) before getting started.

## 📜 License

Licensed under MIT License and copyrights reserved.
