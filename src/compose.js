import fs from 'fs';
import path from 'path';
import { ICON_COLOR, resolveBase, resolveLinuxFolder, resolveColor } from './folders.js';

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
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
    const asFile = path.resolve(overlay);
    if (fs.existsSync(asFile)) return asFile;
    throw new Error(`Overlay image not found: ${overlay}`);
}

// Resolve the folder base into a 1024 PNG buffer + placement constraints.
// - linux: read the machine's current theme folder icon; tint it if a color is given.
// - mac/windows: use the bundled pre-rendered variant.
async function resolveBaseBuffer(sharp, os, variant) {
    if (os === 'linux') {
        const { filePath, constraints } = resolveLinuxFolder();
        if (!fs.existsSync(filePath)) {
            throw new Error(`Folder icon not found: ${filePath}`);
        }
        const isSvg = path.extname(filePath).toLowerCase() === '.svg';
        let pipeline = sharp(filePath, isSvg ? { density: 384 } : undefined)
            .resize(CANVAS, CANVAS, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

        const color = resolveColor(variant);
        if (color) {
            pipeline = pipeline.tint(color);
        }
        return { baseBuffer: await pipeline.png().toBuffer(), constraints, colorKey: null };
    }

    const { filePath, constraints, colorKey } = resolveBase(os, variant);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Folder base asset missing: ${filePath}`);
    }
    const baseBuffer = await sharp(filePath).resize(CANVAS, CANVAS, { fit: 'fill' }).png().toBuffer();
    return { baseBuffer, constraints, colorKey };
}

/**
 * Compose a folder icon: folder base + optional overlay image laid on top.
 * - os: 'mac' | 'windows' | 'linux'
 * - variant: variant name (mac/win) or color preset/hex (linux base tint)
 * - overlay: path to a user image (or null for the bare base)
 * - adjustColor: recolor the overlay to match the variant hue (mac/win only)
 * - scale: overlay zoom factor
 * Returns a PNG buffer (1024x1024).
 */
export async function composeFolderIcon({ os, variant, overlay, adjustColor = false, scale = 1 }) {
    const { default: sharp } = await import('sharp');
    const { baseBuffer, constraints, colorKey } = await resolveBaseBuffer(sharp, os, variant);

    if (!overlay) {
        return sharp(baseBuffer).png().toBuffer();
    }

    const overlaySource = await loadOverlaySource(overlay);
    const isSvg = path.extname(overlaySource).toLowerCase() === '.svg';

    let overlayBuf = await sharp(overlaySource, isSvg ? { density: 384 } : undefined)
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

    if (adjustColor && colorKey && ICON_COLOR[colorKey]) {
        overlayBuf = await recolorOverlay(sharp, overlayBuf, ICON_COLOR[colorKey]);
    }

    const top = Math.round(constraints.startY + constraints.folderAreaHeight / 2 - dim.height / 2);
    const left = Math.round(CANVAS / 2 - dim.width / 2);

    return sharp(baseBuffer)
        .composite([{ input: overlayBuf, top, left }])
        .png()
        .toBuffer();
}
