import fs from 'fs';
import path from 'path';
import { ICON_COLOR, resolveBase, resolveBuiltinOverlay } from './folders.js';

const CANVAS = 1024;

function fitOverlay(width, height, c) {
    const aspect = width / height;
    let w;
    let h;
    if (aspect === 1) {
        w = h = c.preferredSize;
    } else if (aspect > 1) {
        w = c.maxWidth;
        h = w / aspect;
        if (h > c.maxHeight) {
            h = c.maxHeight;
            w = h * aspect;
        }
    } else {
        h = c.maxHeight;
        w = h * aspect;
        if (w > c.maxWidth) {
            w = c.maxWidth;
            h = w / aspect;
        }
    }
    return { width: Math.round(w), height: Math.round(h) };
}

// Recolor every visible pixel to a flat tint (like FolderArt's adjustIconColor).
async function recolorOverlay(sharp, buffer, color) {
    const img = sharp(buffer).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        if (data[i + 3] > 100) data[i + 3] = 255;
    }
    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer();
}

async function loadOverlaySource(overlay) {
    const builtin = resolveBuiltinOverlay(overlay);
    if (builtin && fs.existsSync(builtin)) return builtin;
    const asFile = path.resolve(overlay);
    if (fs.existsSync(asFile)) return asFile;
    throw new Error(`Overlay not found: ${overlay} (not a built-in icon nor an existing file)`);
}

/**
 * Compose a folder icon: base folder + optional overlay (built-in name or file),
 * recolored to match the variant when adjustColor is set.
 * Returns a PNG buffer (1024x1024).
 */
export async function composeFolderIcon({ os, variant, overlay, adjustColor = false, scale = 1 }) {
    const { default: sharp } = await import('sharp');
    const { filePath, constraints, colorKey } = resolveBase(os, variant);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Folder base asset missing: ${filePath}`);
    }

    const base = sharp(filePath).resize(CANVAS, CANVAS, { fit: 'fill' });

    if (!overlay) {
        return base.png().toBuffer();
    }

    const overlaySource = await loadOverlaySource(overlay);
    const ext = path.extname(overlaySource).toLowerCase();
    const density = ext === '.svg' ? 384 : undefined;

    let overlayBuf = await sharp(overlaySource, density ? { density } : undefined)
        .ensureAlpha()
        .toBuffer();

    const meta = await sharp(overlayBuf).metadata();
    const c = {
        maxWidth: constraints.maxWidth * scale,
        maxHeight: constraints.maxHeight * scale,
        preferredSize: constraints.preferredSize * scale,
    };
    const dim = fitOverlay(meta.width, meta.height, c);

    overlayBuf = await sharp(overlayBuf)
        .resize(dim.width, dim.height, { fit: 'fill' })
        .png()
        .toBuffer();

    if (adjustColor) {
        overlayBuf = await recolorOverlay(sharp, overlayBuf, ICON_COLOR[colorKey]);
    }

    const top = Math.round(constraints.startY + constraints.folderAreaHeight / 2 - dim.height / 2);
    const left = Math.round(CANVAS / 2 - dim.width / 2);

    return base
        .composite([{ input: overlayBuf, top, left }])
        .png()
        .toBuffer();
}
