import fs from 'fs';
import path from 'path';
import { getConfigPath } from './config.js';
import { sha256Hex, ed2kHex } from './hash.js';
import { convertToIco } from './convert.js';

export function getStoreDir() {
    return path.join(path.dirname(getConfigPath()), 'icons');
}

function getIndexPath() {
    return path.join(getStoreDir(), 'index.json');
}

export function loadIndex() {
    try {
        return JSON.parse(fs.readFileSync(getIndexPath(), 'utf8'));
    } catch {
        return {};
    }
}

export function saveIndex(index) {
    fs.mkdirSync(getStoreDir(), { recursive: true });
    fs.writeFileSync(getIndexPath(), JSON.stringify(index, null, 2));
}

export async function resolveStoredIcon(sourcePath, needsConversion, sizes) {
    const absSource = path.resolve(sourcePath);
    if (!fs.existsSync(absSource)) {
        throw new Error(`Icon file does not exist: ${absSource}`);
    }

    const buffer = fs.readFileSync(absSource);
    const sha = sha256Hex(buffer);
    const sourceExt = path.extname(absSource).toLowerCase();
    const targetExt = needsConversion ? '.ico' : sourceExt;
    const sizeKey = needsConversion ? sizes.join('-') : '';
    const storeId = sizeKey ? `${sha}_${sizeKey}` : sha;

    const storeDir = getStoreDir();
    fs.mkdirSync(storeDir, { recursive: true });
    const storePath = path.join(storeDir, `${storeId}${targetExt}`);

    if (fs.existsSync(storePath)) {
        console.log(`♻️  Reusing cached icon (${storeId.slice(0, 12)}…)`);
    } else if (needsConversion) {
        console.log(`📸 Converting ${path.extname(absSource)} to ICO...`);
        await convertToIco(absSource, storePath, sizes);
        console.log('✓ Converted and stored in the icon cache');
    } else {
        fs.copyFileSync(absSource, storePath);
    }

    const index = loadIndex();
    if (!index[storeId]) {
        index[storeId] = {
            sha256: sha,
            ed2k: ed2kHex(buffer),
            originalName: path.basename(absSource),
            sourceExt,
            sizes: needsConversion ? sizes : null,
            storeFile: path.basename(storePath),
            createdAt: new Date().toISOString(),
            usedBy: []
        };
        saveIndex(index);
    }

    return { storePath, storeId };
}

export function trackUsage(storeId, folderAbs) {
    try {
        const index = loadIndex();
        for (const id of Object.keys(index)) {
            if (Array.isArray(index[id].usedBy)) {
                index[id].usedBy = index[id].usedBy.filter(f => f !== folderAbs);
            }
        }
        if (index[storeId]) {
            index[storeId].usedBy.push(folderAbs);
            saveIndex(index);
        }
    } catch {
    }
}
