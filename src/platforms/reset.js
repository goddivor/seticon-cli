import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LOCAL_ICON_NAME = 'seticon.ico';

function clearWindowsAttributes(target) {
    try {
        execSync(`attrib -H -S -R "${target}"`, { stdio: 'ignore' });
    } catch {
    }
}

// Undo what setFolderIconWindows wrote: clear attributes, remove desktop.ini and
// any leftover local icon copy. Returns true if a customization was removed.
export function resetFolderIconWindows(folderPath) {
    const desktopIni = path.join(folderPath, 'desktop.ini');
    const localIcon = path.join(folderPath, LOCAL_ICON_NAME);
    let removed = false;

    clearWindowsAttributes(folderPath);
    try {
        execSync(`attrib -R "${folderPath}"`, { stdio: 'ignore' });
    } catch {
    }

    if (fs.existsSync(desktopIni)) {
        clearWindowsAttributes(desktopIni);
        try { fs.unlinkSync(desktopIni); removed = true; } catch {}
    }
    // Remove a stray local icon left by older versions.
    if (fs.existsSync(localIcon)) {
        clearWindowsAttributes(localIcon);
        try { fs.unlinkSync(localIcon); removed = true; } catch {}
    }
    return removed;
}

// Undo what setFolderIconLinux wrote: unset the gio metadata and delete the
// .directory file.
export function resetFolderIconLinux(folderPath) {
    let removed = false;

    try {
        execSync(
            `gio set ${JSON.stringify(folderPath)} -d metadata::custom-icon`,
            { stdio: ['ignore', 'ignore', 'pipe'] }
        );
        removed = true;
    } catch {
    }

    const dotDirectory = path.join(folderPath, '.directory');
    if (fs.existsSync(dotDirectory)) {
        try { fs.unlinkSync(dotDirectory); removed = true; } catch {}
    }
    return removed;
}

// Undo what setFolderIconMacOS wrote: reset the folder icon to the default by
// passing a nil image to NSWorkspace.setIcon.
export function resetFolderIconMacOS(folderPath) {
    const script = `ObjC.import('Cocoa');
var success = $.NSWorkspace.sharedWorkspace.setIconForFileOptions($(), ${JSON.stringify(folderPath)}, 0);
if (!success) { throw new Error('NSWorkspace returned false'); }`;
    try {
        execSync('osascript -l JavaScript -', { input: script, stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    } catch (e) {
        const stderr = e.stderr ? e.stderr.toString().trim() : e.message;
        throw new Error(`osascript failed: ${stderr}`);
    }
}
