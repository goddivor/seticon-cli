import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function clearWindowsAttributes(target) {
    try {
        execSync(`attrib -H -S -R "${target}"`, { stdio: 'ignore' });
    } catch {
    }
}

function removeLegacyFolderIcon(folderPath, desktopIni) {
    try {
        const content = fs.readFileSync(desktopIni, 'utf8');
        const match = content.match(/^IconResource=(.+?),\s*\d+\s*$/mi);
        if (!match) return;

        const ref = match[1].trim();
        if (path.isAbsolute(ref)) return;

        const oldIconPath = path.join(folderPath, ref);
        if (fs.existsSync(oldIconPath)) {
            clearWindowsAttributes(oldIconPath);
            fs.unlinkSync(oldIconPath);
        }
    } catch {
    }
}

function refreshWindowsIcon() {
    try {
        execSync('ie4uinit.exe -show', { stdio: 'ignore' });
    } catch {
        try {
            execSync('ie4uinit.exe -ClearIconCache', { stdio: 'ignore' });
        } catch {
        }
    }
}

export function setFolderIconWindows(folderPath, iconPath) {
    const desktopIni = path.join(folderPath, 'desktop.ini');

    clearWindowsAttributes(folderPath);
    if (fs.existsSync(desktopIni)) {
        clearWindowsAttributes(desktopIni);
        removeLegacyFolderIcon(folderPath, desktopIni);
    }

    const iniContent = `[.ShellClassInfo]
IconResource=${iconPath},0
[ViewState]
Mode=
Vid=
FolderType=Generic
`;
    fs.writeFileSync(desktopIni, iniContent);
    execSync(`attrib +H +S "${desktopIni}"`, { stdio: 'ignore' });
    execSync(`attrib +R "${folderPath}"`, { stdio: 'ignore' });
    refreshWindowsIcon();

    console.log(`✓ Folder icon changed (Windows): ${folderPath}`);
    return true;
}
