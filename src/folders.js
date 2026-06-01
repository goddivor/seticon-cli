import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getAssetsDir() {
    return path.join(__dirname, '..', 'assets');
}

// FolderArt-style named color presets (absolute hex, applied via tint).
export const COLOR_PRESETS = {
    blue: '#3399e0',
    green: '#18ab68',
    lime: '#3aad4b',
    yellow: '#caa41b',
    orange: '#cd6f04',
    red: '#ce2d24',
    purple: '#833f9d',
    gray: '#666666',
    black: '#111111',
    pink: '#c9547a',
};

// Resolve a variant token to a hex color: a preset name or a raw hex (#rgb/#rrggbb).
export function resolveColor(token) {
    if (!token) return null;
    const key = token.toLowerCase();
    if (COLOR_PRESETS[key]) return COLOR_PRESETS[key];
    if (/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i.test(token)) {
        return token.startsWith('#') ? token : `#${token}`;
    }
    return null;
}

// Convert a #rgb / #rrggbb hex string to an { r, g, b } object.
export function hexToRgb(hex) {
    if (!hex) return null;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// RGB tints used to recolor an overlay so it matches the folder hue.
export const ICON_COLOR = {
    'mac-os-default-dark': { r: 51, g: 157, b: 224 },
    'mac-os-default-light': { r: 63, g: 170, b: 230 },
    'mac-os-green': { r: 24, g: 171, b: 104 },
    'mac-os-lime': { r: 58, g: 173, b: 75 },
    'mac-os-yellow': { r: 202, g: 164, b: 27 },
    'mac-os-orange': { r: 205, g: 111, b: 4 },
    'mac-os-red': { r: 206, g: 45, b: 36 },
    'mac-os-purple': { r: 131, g: 63, b: 157 },
    'mac-os-gray': { r: 102, g: 102, b: 102 },
    'mac-os-black': { r: 17, g: 17, b: 17 },
};

// Placement constraints (canvas is 1024x1024), ported from FolderArt.
const MAC_CONSTRAINTS = { maxWidth: 768, maxHeight: 384, preferredSize: 384, startY: 258, folderAreaHeight: 604 };
export const WINDOWS_CONSTRAINTS = { maxWidth: 768, maxHeight: 384, preferredSize: 384, startY: 286, folderAreaHeight: 546 };
const LINUX_CONSTRAINTS = { maxWidth: 520, maxHeight: 300, preferredSize: 300, startY: 360, folderAreaHeight: 360 };

// Bundled folder bases. Only macOS ships pre-rendered assets (used as the only
// value --os can force). Windows reads the OS native icon, Linux the theme.
export const OS_FOLDERS = {
    mac: {
        dir: 'mac-os',
        constraints: MAC_CONSTRAINTS,
        defaultVariant: 'default-dark',
        variants: {
            'default-dark': 'mac-os-default-dark',
            'default-light': 'mac-os-default-light',
            green: 'mac-os-green',
            lime: 'mac-os-lime',
            yellow: 'mac-os-yellow',
            orange: 'mac-os-orange',
            red: 'mac-os-red',
            purple: 'mac-os-purple',
            gray: 'mac-os-gray',
            black: 'mac-os-black',
        },
    },
};

// Recognized OS values (auto-detected). Only `mac` may be forced via --os.
export const SUPPORTED_OS = ['mac', 'windows', 'linux'];
export const FORCEABLE_OS = ['mac'];

// Map the running platform to a default folder look.
export function detectOs() {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'mac';
    return 'linux';
}

const ICON_THEME_DIRS = [
    '/usr/share/icons',
    process.env.HOME ? path.join(process.env.HOME, '.local', 'share', 'icons') : null,
    process.env.HOME ? path.join(process.env.HOME, '.icons') : null,
].filter(Boolean);

function currentLinuxIconTheme() {
    try {
        const out = execSync('gsettings get org.gnome.desktop.interface icon-theme', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        return out.trim().replace(/^'|'$/g, '');
    } catch {
        return 'hicolor';
    }
}

function themeDir(theme) {
    for (const base of ICON_THEME_DIRS) {
        const d = path.join(base, theme);
        if (fs.existsSync(path.join(d, 'index.theme'))) return d;
    }
    return null;
}

function themeInherits(theme) {
    const d = themeDir(theme);
    if (!d) return [];
    try {
        const idx = fs.readFileSync(path.join(d, 'index.theme'), 'utf8');
        const m = idx.match(/^Inherits=(.+)$/m);
        return m ? m[1].split(',').map((s) => s.trim()) : [];
    } catch {
        return [];
    }
}

// Largest places/folder.{svg,png} within one theme (svg preferred).
function findFolderInTheme(theme) {
    const d = themeDir(theme);
    if (!d) return null;
    let best = null;
    let bestScore = 0;
    const stack = [d];
    while (stack.length) {
        const cur = stack.pop();
        let entries;
        try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
        for (const e of entries) {
            const p = path.join(cur, e.name);
            if (e.isDirectory()) { stack.push(p); continue; }
            if (!p.includes('places')) continue;
            if (e.name === 'folder.svg') return p;
            if (e.name === 'folder.png') {
                const m = p.match(/(\d+)x\d+/);
                const score = (m ? Number(m[1]) : 0) * (p.includes('@2x') ? 2 : 1);
                if (score > bestScore) { bestScore = score; best = p; }
            }
        }
    }
    return best;
}

// Resolve the running machine's folder icon (current theme + inheritance chain).
export function resolveLinuxFolder() {
    const theme = currentLinuxIconTheme();
    const chain = [theme, ...themeInherits(theme), 'Adwaita', 'hicolor'];
    const seen = new Set();
    for (const t of chain) {
        if (seen.has(t)) continue;
        seen.add(t);
        const file = findFolderInTheme(t);
        if (file) return { filePath: file, theme: t, constraints: LINUX_CONSTRAINTS };
    }
    throw new Error('No folder icon found in the current icon theme. Install an icon theme (e.g. Adwaita).');
}

export function resolveBase(os, variant) {
    const entry = OS_FOLDERS[os];
    if (!entry) {
        throw new Error(`Unsupported OS: ${os}. Supported: ${SUPPORTED_OS.join(', ')}`);
    }
    const variantKey = variant || entry.defaultVariant;
    const file = entry.variants[variantKey];
    if (!file) {
        const available = Object.keys(entry.variants).join(', ');
        throw new Error(`Unsupported variant "${variantKey}" for ${os}. Available: ${available}`);
    }
    return {
        filePath: path.join(getAssetsDir(), 'folders', entry.dir, `${file}.webp`),
        constraints: entry.constraints,
        colorKey: file,
    };
}
