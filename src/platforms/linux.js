import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function setFolderIconLinux(folderPath, iconPath) {
    const applied = [];

    try {
        execSync(
            `gio set ${JSON.stringify(folderPath)} metadata::custom-icon ${JSON.stringify(`file://${iconPath}`)}`,
            { stdio: ['ignore', 'ignore', 'pipe'] }
        );
        applied.push('gio metadata (GNOME family)');
    } catch {
    }

    try {
        const dotDirectory = path.join(folderPath, '.directory');
        fs.writeFileSync(dotDirectory, `[Desktop Entry]\nIcon=${iconPath}\n`);
        applied.push('.directory file (KDE family)');
    } catch {
    }

    if (applied.length === 0) {
        const desktop = process.env.XDG_CURRENT_DESKTOP || 'unknown';
        throw new Error(`No method worked on Linux (current desktop: ${desktop}). Install gio or use a KDE-compatible file manager.`);
    }

    console.log(`✓ Folder icon changed (Linux): ${folderPath}`);
    console.log(`  Methods: ${applied.join(' + ')}`);
    return true;
}
