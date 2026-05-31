import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getAssetsDir() {
    return path.join(__dirname, '..', 'assets');
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
    'windows-11-default': { r: 180, g: 126, b: 1 },
    'windows-11-pink': { r: 201, g: 84, b: 122 },
    'linux-adwaita': { r: 255, g: 255, b: 255 },
};

// Placement constraints (canvas is 1024x1024), ported from FolderArt.
const MAC_CONSTRAINTS = { maxWidth: 768, maxHeight: 384, preferredSize: 384, startY: 258, folderAreaHeight: 604 };
const WINDOWS_CONSTRAINTS = { maxWidth: 768, maxHeight: 384, preferredSize: 384, startY: 286, folderAreaHeight: 546 };
const LINUX_CONSTRAINTS = { maxWidth: 520, maxHeight: 300, preferredSize: 300, startY: 360, folderAreaHeight: 360 };

// Folder bases available per OS. `defaultVariant` is used when none is given.
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
    windows: {
        dir: 'windows-11',
        constraints: WINDOWS_CONSTRAINTS,
        defaultVariant: 'default',
        variants: {
            default: 'windows-11-default',
            pink: 'windows-11-pink',
        },
    },
    linux: {
        dir: 'linux',
        constraints: LINUX_CONSTRAINTS,
        defaultVariant: 'adwaita',
        variants: {
            adwaita: 'linux-adwaita',
        },
    },
};

export const SUPPORTED_OS = Object.keys(OS_FOLDERS);

// Map the running platform to a default folder look.
export function detectOs() {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'mac';
    return 'linux';
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
