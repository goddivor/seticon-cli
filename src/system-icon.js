import fs from 'fs';
import path from 'path';
import { getConfigPath } from './config.js';

// Windows generic folder icon: resource id 4 in imageres.dll.mun (Win10/11),
// with imageres.dll as a fallback for older builds.
const WINDOWS_FOLDER_ICON_ID = 4;

function systemCacheDir() {
    const dir = path.join(path.dirname(getConfigPath()), 'system');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

// Candidate files that may hold the stock folder icon, most-specific first.
function windowsIconSources() {
    const root = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
    return [
        path.join(root, 'SystemResources', 'imageres.dll.mun'),
        path.join(root, 'System32', 'imageres.dll'),
        path.join(root, 'SystemResources', 'shell32.dll.mun'),
        path.join(root, 'System32', 'shell32.dll'),
    ];
}

// Pick the largest PNG sub-image of an .ico buffer (Windows icons store a
// 256x256 PNG); fall back to null if the .ico holds only DIB images.
function largestPngFromIco(ico) {
    if (ico.length < 6 || ico.readUInt16LE(2) !== 1) return null;
    const count = ico.readUInt16LE(4);
    let best = null;
    let bestW = 0;
    for (let i = 0; i < count; i++) {
        const e = 6 + i * 16;
        const w = ico[e] === 0 ? 256 : ico[e];
        const size = ico.readUInt32LE(e + 8);
        const off = ico.readUInt32LE(e + 12);
        const isPng = ico[off] === 0x89 && ico[off + 1] === 0x50;
        if (isPng && w >= bestW) {
            bestW = w;
            best = ico.subarray(off, off + size);
        }
    }
    return best;
}

/**
 * Return a PNG buffer of the machine's native Windows folder icon, or null if
 * it cannot be obtained. The extracted icon is cached on disk so the PE parsing
 * runs only once; subsequent calls read the cached PNG directly.
 */
export async function getWindowsFolderIconPng() {
    const cachePath = path.join(systemCacheDir(), 'windows-folder.png');
    if (fs.existsSync(cachePath)) {
        return fs.readFileSync(cachePath);
    }

    let ico;
    try {
        const { extractIconById } = await import('ico-extract');
        for (const src of windowsIconSources()) {
            if (!fs.existsSync(src)) continue;
            try {
                const pe = fs.readFileSync(src);
                ico = Buffer.from(extractIconById(pe, WINDOWS_FOLDER_ICON_ID));
                break;
            } catch {
                // try the next candidate
            }
        }
    } catch {
        return null; // ico-extract unavailable
    }
    if (!ico) return null;

    let png = largestPngFromIco(ico);
    if (!png) {
        // No PNG sub-image: let sharp rasterize the .ico's best frame.
        try {
            const { default: sharp } = await import('sharp');
            png = await sharp(ico).png().toBuffer();
        } catch {
            return null;
        }
    }

    try {
        fs.writeFileSync(cachePath, png);
    } catch {
        // caching is best-effort
    }
    return png;
}

