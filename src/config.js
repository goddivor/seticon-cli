import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SUPPORTED_LANGUAGES = ['en', 'fr'];

export function getVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        return pkg.version;
    } catch {
        return 'unknown';
    }
}

export function getConfigPath() {
    const base = process.platform === 'win32'
        ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'));
    return path.join(base, 'seticon', 'config.json');
}

export function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    } catch {
        return {};
    }
}

export function saveConfig(config) {
    const configPath = getConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getLanguage() {
    const lang = loadConfig().lang;
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}
