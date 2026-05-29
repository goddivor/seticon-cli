<div align="center">

# seticon

[![npm version](https://img.shields.io/npm/v/seticon-cli.svg)](https://www.npmjs.com/package/seticon-cli)
[![license](https://img.shields.io/npm/l/seticon-cli.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./.github/CODE_OF_CONDUCT.md)

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
```

### Supported icon formats per OS

| OS      | Formats accepted               | Notes                                                |
| ------- | ------------------------------ | ---------------------------------------------------- |
| Windows | `.ico` (PNG auto-converted)    | `desktop.ini` written + folder marked system/hidden  |
| macOS   | `.png` / `.jpg` / `.tiff` / `.icns` | Asks for Finder automation permission on first run |
| Linux   | `.png` / `.jpg` / `.svg` / `.ico` | GNOME via `gio`, KDE via `.directory`              |
