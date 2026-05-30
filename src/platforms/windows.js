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

function removeLegacyLocalIcon(folderPath, desktopIni) {
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

export function setFolderIconWindows(folderPath, iconPath) {
    const desktopIni = path.join(folderPath, 'desktop.ini');
    const localIcon = path.join(folderPath, LOCAL_ICON_NAME);

    clearWindowsAttributes(folderPath);
    if (fs.existsSync(desktopIni)) {
        clearWindowsAttributes(desktopIni);
        removeLegacyLocalIcon(folderPath, desktopIni);
    }
    if (fs.existsSync(localIcon)) {
        clearWindowsAttributes(localIcon);
        try { fs.unlinkSync(localIcon); } catch {}
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

    console.log(`✓ Folder icon changed (Windows): ${folderPath}`);
    return true;
}
