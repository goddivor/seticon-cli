import { execSync } from 'child_process';

export function setFolderIconMacOS(folderPath, iconPath) {
    const script = `ObjC.import('Cocoa');
var image = $.NSImage.alloc.initWithContentsOfFile(${JSON.stringify(iconPath)});
if (image.isNil()) { throw new Error('Failed to load icon: invalid image file'); }
var success = $.NSWorkspace.sharedWorkspace.setIconForFileOptions(image, ${JSON.stringify(folderPath)}, 0);
if (!success) { throw new Error('NSWorkspace returned false (try granting automation permission to Terminal)'); }`;

    try {
        execSync('osascript -l JavaScript -', { input: script, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
        const stderr = e.stderr ? e.stderr.toString().trim() : e.message;
        throw new Error(`osascript failed: ${stderr}`);
    }

    console.log(`✓ Folder icon changed (macOS): ${folderPath}`);
    return true;
}
