import fs from 'fs';
import path from 'path';
import { ICON_COLOR, OS_FOLDERS, resolveBase, resolveLinuxFolder, resolveColor, hexToRgb } from './folders.js';

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

// Average color of the visible (opaque) pixels of a PNG buffer.
async function dominantColor(sharp, buffer) {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i + 3] > 128) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
        }
    }
    if (!n) return null;
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

// Build a base from a raw folder-icon PNG buffer (linux theme / windows native):
// fit to the canvas, tint if a color was requested, and pick the overlay tint.
async function baseFromPng(sharp, pngBuffer, constraints, variant) {
    const color = resolveColor(variant);
    let pipeline = sharp(pngBuffer)
        .resize(CANVAS, CANVAS, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    if (color) {
        pipeline = pipeline.tint(color);
    }
    const baseBuffer = await pipeline.png().toBuffer();
    const tint = color ? hexToRgb(color) : await dominantColor(sharp, baseBuffer);
    return { baseBuffer, constraints, tint };
}

// Resolve the folder base into a 1024 PNG buffer + placement constraints.
// - linux: read the machine's current theme folder icon.
// - windows (on a real Windows host): read the OS native folder icon (cached).
// - otherwise (cross-OS look, or windows fallback): bundled pre-rendered variant.
async function resolveBaseBuffer(sharp, os, variant) {
    if (os === 'linux') {
        const { filePath, constraints } = resolveLinuxFolder();
        if (!fs.existsSync(filePath)) {
            throw new Error(`Folder icon not found: ${filePath}`);
        }
        const isSvg = path.extname(filePath).toLowerCase() === '.svg';
        const raw = await sharp(filePath, isSvg ? { density: 384 } : undefined).png().toBuffer();
        return baseFromPng(sharp, raw, constraints, variant);
    }

    if (os === 'windows' && process.platform === 'win32') {
        const { getWindowsFolderIconPng } = await import('./system-icon.js');
        const nativePng = await getWindowsFolderIconPng();
        if (nativePng) {
            return baseFromPng(sharp, nativePng, OS_FOLDERS.windows.constraints, variant);
        }
        // fall through to the bundled asset below
    }

    const { filePath, constraints, colorKey } = resolveBase(os, variant);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Folder base asset missing: ${filePath}`);
    }
    const baseBuffer = await sharp(filePath).resize(CANVAS, CANVAS, { fit: 'fill' }).png().toBuffer();
    return { baseBuffer, constraints, tint: ICON_COLOR[colorKey] || null };
}

function escapeXml(s) {
    return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function rgbToHex(c) {
    const h = (v) => v.toString(16).padStart(2, '0');
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

// Render text to a PNG buffer that fits within the folder area.
// Render at a large fixed size, trim to the real glyph bounds, then scale to fit.
async function renderText(sharp, text, color, c) {
    const maxW = Math.round(c.maxWidth);
    const maxH = Math.round(c.maxHeight);
    const RENDER = 400;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${RENDER * 2}">
<text x="20" y="${RENDER}" font-family="sans-serif" font-weight="bold" font-size="${RENDER}"
fill="${color}">${escapeXml(text)}</text>
</svg>`;
    const rendered = await sharp(Buffer.from(svg)).png().trim().toBuffer();
    const meta = await sharp(rendered).metadata();

    const ratio = Math.min(maxW / meta.width, maxH / meta.height, 1);
    const w = Math.max(1, Math.round(meta.width * ratio));
    const h = Math.max(1, Math.round(meta.height * ratio));
    return sharp(rendered).resize(w, h, { fit: 'fill' }).png().toBuffer();
}

/**
 * Compose a folder icon: folder base + optional overlay (image or text).
 * - os: 'mac' | 'windows' | 'linux'
 * - variant: variant name (mac/win) or color preset/hex (linux base tint)
 * - overlay: path to a user image (or null)
 * - text: text to draw on the folder (mutually exclusive with overlay)
 * - textColor: hex color for the text (defaults to the folder color)
 * - adjustColor: recolor the image overlay to match the variant/color
 * - scale: overlay zoom factor
 * Returns a PNG buffer (1024x1024).
 */
export async function composeFolderIcon({ os, variant, overlay, text, textColor, adjustColor = false, scale = 1 }) {
    const { default: sharp } = await import('sharp');
    const { baseBuffer, constraints, tint } = await resolveBaseBuffer(sharp, os, variant);

    if (text) {
        const c = {
            maxWidth: constraints.maxWidth * scale,
            maxHeight: constraints.maxHeight * scale,
        };
        const color = textColor || (tint ? rgbToHex(tint) : '#ffffff');
        const textBuf = await renderText(sharp, text, color, c);
        const meta = await sharp(textBuf).metadata();
        const top = Math.round(constraints.startY + constraints.folderAreaHeight / 2 - meta.height / 2);
        const left = Math.round(CANVAS / 2 - meta.width / 2);
        return sharp(baseBuffer)
            .composite([{ input: textBuf, top, left }])
            .png()
            .toBuffer();
    }

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

    if (adjustColor && tint) {
        overlayBuf = await recolorOverlay(sharp, overlayBuf, tint);
    }

    const top = Math.round(constraints.startY + constraints.folderAreaHeight / 2 - dim.height / 2);
    const left = Math.round(CANVAS / 2 - dim.width / 2);

    return sharp(baseBuffer)
        .composite([{ input: overlayBuf, top, left }])
        .png()
        .toBuffer();
}
