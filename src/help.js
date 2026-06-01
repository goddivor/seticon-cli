import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVersion, getLanguage, SUPPORTED_LANGUAGES } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Help text lives in src/help/<lang>.json as { "help": "..." } with a
// {{version}} placeholder, so translations are plain data, not code.
function loadHelpText(lang) {
    const file = path.join(__dirname, 'help', `${lang}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8')).help;
}

export function showHelp(lang = getLanguage()) {
    const chosen = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    let text;
    try {
        text = loadHelpText(chosen);
    } catch {
        text = loadHelpText('en');
    }
    console.log(text.replaceAll('{{version}}', getVersion()));
}
