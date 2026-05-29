# seticon

Cross-platform CLI to change folder icons on **Windows**, **macOS** and **Linux**.

Automatically converts PNG icons to multi-size ICO on Windows, and uses the
right mechanism for each desktop environment elsewhere.

## Features

- **Cross-platform** — Windows, macOS, Linux (GNOME and KDE)
- **PNG → ICO conversion** built in (multi-size: 16, 32, 48, 64, 128, 256)
- **No admin / sudo required** for the icon change itself
- **Native icon format support** on macOS and Linux (PNG, JPG, SVG, ICO)
- **Detects the OS** and applies the correct mechanism automatically:
  - Windows → `desktop.ini` + `attrib +H +S +R`
  - macOS   → `NSWorkspace.setIcon` via `osascript` (Finder)
  - Linux   → `gio set metadata::custom-icon` (GNOME) + `.directory` (KDE)

## Installation

```bash
npm install -g seticon
```

Node.js **18.17+** is required.

## Usage

```bash
# Set a folder icon (auto-converts PNG → ICO on Windows)
seticon set -f "./MyFolder" -i "./icon.png"

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

## How it works

### Windows
Writes a `desktop.ini` file inside the target folder:

```ini
[.ShellClassInfo]
IconResource=path\to\icon.ico,0
```

Then applies `+H +S` to the `desktop.ini` and `+R` to the folder so Explorer
picks up the icon.

### macOS
Calls `NSWorkspace.sharedWorkspace.setIcon_forFile_options_` via JXA
(`osascript -l JavaScript`). The first run will ask for Finder automation
permission.

### Linux
- **GNOME / Nautilus**: `gio set "<folder>" metadata::custom-icon "file://<icon>"`
- **KDE / Dolphin**: writes a `.directory` file with `Icon=<absolute path>`

Both are applied so the icon shows up regardless of the file manager.
You may need to refresh the file manager (F5) to see the change.

## Requirements

- Node.js >= 18.17.0
- Windows: works out of the box
- macOS: Finder automation permission (prompted on first run)
- Linux: `gio` (part of `glib2`, present by default on most distros)

## License

MIT © Divor

## Links

- [Repository](https://github.com/goddivor/seticon)
- [Issues](https://github.com/goddivor/seticon/issues)
- [npm package](https://www.npmjs.com/package/seticon-cli)
