<div align="center">

# seticon

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

Automatically converts PNG icons to multi-size ICO on Windows, and uses the
right mechanism for each desktop environment elsewhere.

</div>

## Features

- **Cross-platform** — Windows, macOS, Linux (GNOME and KDE)
- **PNG → ICO conversion** built in (multi-size: 16, 32, 48, 64, 128, 256)
- **No admin / sudo required** for the icon change itself
- **Native icon format support** on macOS and Linux (PNG, JPG, SVG, ICO)
- **Detects the OS** and applies the correct mechanism automatically:
  - Windows → `desktop.ini` + `attrib +H +S +R`
  - macOS   → `NSWorkspace.setIcon` via `osascript` (Finder)
  - Linux   → `gio set metadata::custom-icon` (GNOME) + `.directory` (KDE)

## Requirements

- Node.js >= 18.17.0
- Windows: works out of the box
- macOS: Finder automation permission (prompted on first run)
- Linux: `gio` (part of `glib2`, present by default on most distros)

## Installation

```bash
npm i seticon-cli
```

Or install it globally to use the `seticon` command anywhere:

```bash
npm i -g seticon-cli
```

## Usage

```bash
# Set a folder icon (auto-converts PNG → ICO on Windows)
seticon set -f "./MyFolder" -i "./icon.png"

# Shorthand: positional arguments, no flags needed
seticon "./MyFolder" "./icon.png"
seticon convert "./image.png" "./icon.ico"

# Long options also work
seticon set --folder "Documents" --icon "logo.ico"

# Convert PNG to ICO without setting an icon
seticon convert -i "./image.png" -o "./icon.ico"

# Pick specific sizes for the ICO output
seticon convert --icon "photo.png" --output "icon.ico" --sizes 16,32,48

# Show the full manual
seticon --help

# Switch the interface language, remembered for next runs (en, fr)
seticon --lang fr
seticon -l en
```

### Supported icon formats per OS

| OS      | Formats accepted               | Notes                                                |
| ------- | ------------------------------ | ---------------------------------------------------- |
| Windows | `.ico` (PNG auto-converted)    | `desktop.ini` written + folder marked system/hidden  |
| macOS   | `.png` / `.jpg` / `.tiff` / `.icns` | Asks for Finder automation permission on first run |
| Linux   | `.png` / `.jpg` / `.svg` / `.ico` | GNOME via `gio`, KDE via `.directory`              |
