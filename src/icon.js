import fs from 'fs';
import path from 'path';
import { resolveStoredIcon, trackUsage } from './store.js';
import { setFolderIconWindows } from './platforms/windows.js';
import { setFolderIconMacOS } from './platforms/macos.js';
import { setFolderIconLinux } from './platforms/linux.js';

const SUPPORTED_FORMATS = ['.ico', '.jpg', '.jpeg', '.bmp', '.png', '.tif', '.tiff', '.webp', '.svg'];
const NO_CONVERSION_FORMATS = ['.png', '.ico'];

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

export async function processIconChange(folderPath, iconOrImagePath, dimensions = [16, 32, 48, 64, 128, 256]) {
    try {
        const ext = path.extname(iconOrImagePath).toLowerCase();

        if (!SUPPORTED_FORMATS.includes(ext)) {
            throw new Error(`Unsupported icon format: ${ext}. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
        }

        const needsConversion = !NO_CONVERSION_FORMATS.includes(ext);

        const { storePath, storeId } = await resolveStoredIcon(iconOrImagePath, needsConversion, dimensions);

        setFolderIcon(folderPath, storePath);
        trackUsage(storeId, path.resolve(folderPath));
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}
