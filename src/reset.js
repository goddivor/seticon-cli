import fs from 'fs';
import path from 'path';
import { untrackUsage } from './store.js';
import {
    resetFolderIconWindows,
    resetFolderIconMacOS,
    resetFolderIconLinux,
} from './platforms/reset.js';

/**
 * Remove a custom folder icon and restore the OS default.
 * Returns true on success (whether or not a customization was present).
 */
export async function resetFolderIcon(folderPath) {
    const abs = path.resolve(folderPath);
    if (!fs.existsSync(abs)) {
        console.error(`❌ Error: Folder does not exist: ${abs}`);
        return false;
    }

    try {
        let removed;
        switch (process.platform) {
            case 'win32':
                removed = resetFolderIconWindows(abs);
                break;
            case 'darwin':
                removed = resetFolderIconMacOS(abs);
                break;
            case 'linux':
                removed = resetFolderIconLinux(abs);
                break;
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }

        untrackUsage(abs);

        if (removed) {
            console.log(`✓ Folder icon reset to default: ${abs}`);
        } else {
            console.log(`✓ No custom icon found; folder already at default: ${abs}`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}
