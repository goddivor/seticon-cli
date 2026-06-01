import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectOs, FORCEABLE_OS } from './folders.js';
import { composeFolderIcon } from './compose.js';
import { processIconChange } from './icon.js';
import { convertToIco } from './convert.js';

/**
 * Compose an overlay icon (folder base + user image on top) and either apply it
 * to a folder (-f) or save it to a file (-o).
 *
 * opts: { folder, output, image, os, variant, iconColor, zoom, sizes }
 *   - image: path to the user image to lay over the folder
 *   - os: only 'mac' may be forced; otherwise the running platform is used
 *   - iconColor: 'original' (default) | 'variant'
 */
export async function processOverlayIcon(opts) {
    if (!opts.image && !opts.text) {
        throw new Error('Overlay mode requires an image (-i <image>) or text (--text "...")');
    }
    if (opts.image && opts.text) {
        throw new Error('Overlay mode accepts either an image or text, not both');
    }
    if (!opts.folder && !opts.output) {
        throw new Error('Overlay mode requires either -f <folder> (apply) or -o <file> (save)');
    }
    if (opts.os && !FORCEABLE_OS.includes(opts.os)) {
        throw new Error(`--os only accepts: ${FORCEABLE_OS.join(', ')}. Windows and Linux use the machine's own folder icon (auto-detected).`);
    }

    const osKey = opts.os || detectOs();
    const adjustColor = opts.iconColor === 'variant';

    console.log(`🎨 Composing ${osKey} folder overlay...`);
    const pngBuffer = await composeFolderIcon({
        os: osKey,
        variant: opts.variant,
        overlay: opts.image,
        text: opts.text,
        textColor: opts.textColor,
        adjustColor,
        scale: opts.zoom || 1,
    });

    const tmpDir = path.join(os.tmpdir(), 'seticon');
    fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPng = path.join(tmpDir, `overlay_${Date.now()}_${process.pid}.png`);
    fs.writeFileSync(tmpPng, pngBuffer);

    try {
        if (opts.output) {
            const ext = path.extname(opts.output).toLowerCase();
            if (ext === '.ico') {
                await convertToIco(tmpPng, opts.output, opts.sizes);
            } else if (ext === '.png') {
                fs.copyFileSync(tmpPng, opts.output);
            } else {
                fs.copyFileSync(tmpPng, opts.output);
            }
            console.log(`✓ Saved composed folder icon: ${opts.output}`);
            return true;
        }

        return await processIconChange(opts.folder, tmpPng, opts.sizes);
    } finally {
        try { fs.unlinkSync(tmpPng); } catch {}
    }
}
