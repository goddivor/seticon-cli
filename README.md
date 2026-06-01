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
- **Overlay mode** — lay your image (or text) over a real folder icon, with color variants and zoom
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

## 🧩 Built with

[![sharp](https://img.shields.io/npm/v/sharp?logo=npm&logoColor=fff&label=sharp&labelColor=333&color=CB3837&style=flat)](https://www.npmjs.com/package/sharp)
[![png-to-ico](https://img.shields.io/npm/v/png-to-ico?logo=npm&logoColor=fff&label=png-to-ico&labelColor=333&color=CB3837&style=flat)](https://www.npmjs.com/package/png-to-ico)
[![decode-bmp](https://img.shields.io/npm/v/decode-bmp?logo=npm&logoColor=fff&label=decode-bmp&labelColor=333&color=CB3837&style=flat)](https://www.npmjs.com/package/decode-bmp)
[![ico-extract](https://img.shields.io/npm/v/ico-extract?logo=npm&logoColor=fff&label=ico-extract&labelColor=333&color=CB3837&style=flat)](https://www.npmjs.com/package/ico-extract)

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

Instead of using your image directly, lay it over a real folder icon. Add
`--overlay` (`-ov`):

```bash
# Lay an image over your machine's folder icon, then apply it
seticon set -f "./MyFolder" -i "./logo.png" --overlay

# Color the folder and zoom the overlay (short aliases)
seticon set -f "./Dev" -i "js.png" -ov -va blue -ic variant -z 125

# Color it with a preset or a raw hex
seticon set -f "./Photos" -i "cam.png" -ov -va "#e67e22"

# Draw text on the folder instead of an image
seticon set -f "./Work" --text "WORK" --overlay --variant blue
seticon set -f "./Docs" -t "DOCS" -ov -va red -tc "#ffffff"

# Force the macOS look (the only style you can force from any OS)
seticon set -i "logo.svg" -o "icon.ico" --overlay --os mac --variant red
```

| Option | Alias | Values | Notes |
| ------ | ----- | ------ | ----- |
| `--overlay` | `-ov` | — | Enable overlay mode |
| `--os` | `-os` | `mac` | Force the folder style. Only `mac` is allowed; otherwise the OS is auto-detected |
| `--variant` | `-va` | mac: variant name · windows/linux: color preset or `#hex` | Folder color |
| `--icon-color` | `-ic` | `original`, `variant` | Keep image colors or tint to folder |
| `--text` | `-t` | any short text | Draw text instead of an image |
| `--text-color` | `-tc` | `#hex` | Text color (default: the folder color) |
| `--zoom` | `-z` | `75`, `92`, `100`, `108`, `125` | Overlay size |

> Overlay accepts **either** an image (`-i`) **or** text (`--text`), not both.

> 💡 Overlay mode is inspired by and credits
> [**FolderArt** by christianvmm](https://github.com/christianvmm/folderart),
> whose folder designs and approach this feature builds upon.

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
