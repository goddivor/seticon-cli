import fs from 'fs';
import path from 'path';
import { resolveStoredIcon, trackUsage } from './store.js';
import { setFolderIconWindows } from './platforms/windows.js';
import { setFolderIconMacOS } from './platforms/macos.js';
import { setFolderIconLinux } from './platforms/linux.js';

const NON_WINDOWS_FORMATS = ['.png', '.jpg', '.jpeg', '.ico', '.icns', '.gif', '.tiff', '.bmp', '.svg'];

function setFolderIcon(folderPath, iconPath) {
    const absoluteFolderPath = path.resolve(folderPath);
    const absoluteIconPath = path.resolve(iconPath);

    if (!fs.existsSync(absoluteFolderPath)) {
        throw new Error(`Folder does not exist: ${absoluteFolderPath}`);
    }
    if (!fs.existsSync(absoluteIconPath)) {
        throw new Error(`Icon file does not exist: ${absoluteIconPath}`);
    }

    try {
        switch (process.platform) {
            case 'win32':
                return setFolderIconWindows(absoluteFolderPath, absoluteIconPath);
            case 'darwin':
                return setFolderIconMacOS(absoluteFolderPath, absoluteIconPath);
            case 'linux':
                return setFolderIconLinux(absoluteFolderPath, absoluteIconPath);
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }
    } catch (error) {
        throw new Error(`Failed to set folder icon: ${error.message}`);
    }
}

export async function processIconChange(folderPath, iconOrPngPath, dimensions = [16, 32, 48, 64, 128, 256]) {
    try {
        const ext = path.extname(iconOrPngPath).toLowerCase();
        let needsConversion = false;

        if (process.platform === 'win32') {
            if (ext === '.png') {
                needsConversion = true;
            } else if (ext !== '.ico') {
                throw new Error('On Windows, icon must be .ico or .png');
            }
        } else if (!NON_WINDOWS_FORMATS.includes(ext)) {
            throw new Error(`Unsupported icon format on ${process.platform}: ${ext}`);
        }

        const { storePath, storeId } = await resolveStoredIcon(iconOrPngPath, needsConversion, dimensions);

        setFolderIcon(folderPath, storePath);
        trackUsage(storeId, path.resolve(folderPath));
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}
