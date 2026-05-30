#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_LANGUAGES = ['en', 'fr'];

function getVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        return pkg.version;
    } catch {
        return 'unknown';
    }
}

function getConfigPath() {
    const base = process.platform === 'win32'
        ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'));
    return path.join(base, 'seticon', 'config.json');
}

function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    } catch {
        return {};
    }
}

function saveConfig(config) {
    const configPath = getConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getLanguage() {
    const lang = loadConfig().lang;
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function getStoreDir() {
    return path.join(path.dirname(getConfigPath()), 'icons');
}

function getIndexPath() {
    return path.join(getStoreDir(), 'index.json');
}

function loadIndex() {
    try {
        return JSON.parse(fs.readFileSync(getIndexPath(), 'utf8'));
    } catch {
        return {};
    }
}

function saveIndex(index) {
    fs.mkdirSync(getStoreDir(), { recursive: true });
    fs.writeFileSync(getIndexPath(), JSON.stringify(index, null, 2));
}

function sha256Hex(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function rotl32(x, n) {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function md4(bytes) {
    const msg = Array.from(bytes);
    const bitLen = msg.length * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (let i = 0; i < 8; i++) {
        msg.push(Math.floor(bitLen / Math.pow(2, 8 * i)) & 0xff);
    }

    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
    const F = (x, y, z) => ((x & y) | (~x & z)) >>> 0;
    const G = (x, y, z) => ((x & y) | (x & z) | (y & z)) >>> 0;
    const H = (x, y, z) => (x ^ y ^ z) >>> 0;

    for (let i = 0; i < msg.length; i += 64) {
        const X = new Array(16);
        for (let j = 0; j < 16; j++) {
            X[j] = (msg[i + j * 4] | (msg[i + j * 4 + 1] << 8) | (msg[i + j * 4 + 2] << 16) | (msg[i + j * 4 + 3] << 24)) >>> 0;
        }
        let aa = a, bb = b, cc = c, dd = d;

        const ff = (p, q, r, s, k, sh) => rotl32((p + F(q, r, s) + X[k]) >>> 0, sh);
        const gg = (p, q, r, s, k, sh) => rotl32((p + G(q, r, s) + X[k] + 0x5a827999) >>> 0, sh);
        const hh = (p, q, r, s, k, sh) => rotl32((p + H(q, r, s) + X[k] + 0x6ed9eba1) >>> 0, sh);

        const r1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        for (let n = 0; n < 16; n += 4) {
            a = ff(a, b, c, d, r1[n], 3);
            d = ff(d, a, b, c, r1[n + 1], 7);
            c = ff(c, d, a, b, r1[n + 2], 11);
            b = ff(b, c, d, a, r1[n + 3], 19);
        }
        const r2 = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
        for (let n = 0; n < 16; n += 4) {
            a = gg(a, b, c, d, r2[n], 3);
            d = gg(d, a, b, c, r2[n + 1], 5);
            c = gg(c, d, a, b, r2[n + 2], 9);
            b = gg(b, c, d, a, r2[n + 3], 13);
        }
        const r3 = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
        for (let n = 0; n < 16; n += 4) {
            a = hh(a, b, c, d, r3[n], 3);
            d = hh(d, a, b, c, r3[n + 1], 9);
            c = hh(c, d, a, b, r3[n + 2], 11);
            b = hh(b, c, d, a, r3[n + 3], 15);
        }

        a = (a + aa) >>> 0;
        b = (b + bb) >>> 0;
        c = (c + cc) >>> 0;
        d = (d + dd) >>> 0;
    }

    const out = Buffer.alloc(16);
    [a, b, c, d].forEach((v, i) => out.writeUInt32LE(v >>> 0, i * 4));
    return out;
}

const ED2K_CHUNK = 9728000;

function ed2kHex(buffer) {
    if (buffer.length <= ED2K_CHUNK) {
        return md4(buffer).toString('hex');
    }
    const hashes = [];
    for (let i = 0; i < buffer.length; i += ED2K_CHUNK) {
        hashes.push(md4(buffer.subarray(i, i + ED2K_CHUNK)));
    }
    if (buffer.length % ED2K_CHUNK === 0) {
        hashes.push(md4(Buffer.alloc(0)));
    }
    return md4(Buffer.concat(hashes)).toString('hex');
}

class FolderIconCLI {
    constructor() {
        this.tempDir = path.join(__dirname, 'temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async convertPngToIco(pngPath, icoPath, sizes = [16, 32, 48, 64, 128, 256]) {
        const tempPaths = [];
        try {
            const { default: sharp } = await import('sharp');
            const { default: pngToIco } = await import('png-to-ico');

            const runId = `${Date.now()}_${process.pid}`;
            for (const size of sizes) {
                const buffer = await sharp(pngPath)
                    .resize(size, size, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .png()
                    .toBuffer();
                const tempPath = path.join(this.tempDir, `resize_${runId}_${size}.png`);
                fs.writeFileSync(tempPath, buffer);
                tempPaths.push(tempPath);
            }

            const icoBuffer = await pngToIco(tempPaths);
            fs.writeFileSync(icoPath, icoBuffer);
            return icoPath;
        } catch (error) {
            throw new Error(`Failed to convert PNG to ICO: ${error.message}`);
        } finally {
            for (const tempPath of tempPaths) {
                try { fs.unlinkSync(tempPath); } catch {}
            }
        }
    }

    setFolderIcon(folderPath, iconPath) {
        const absoluteFolderPath = path.resolve(folderPath);
        const absoluteIconPath = path.resolve(iconPath);

        if (!fs.existsSync(absoluteFolderPath)) {
            throw new Error(`Folder does not exist: ${absoluteFolderPath}`);
        }
        if (!fs.existsSync(absoluteIconPath)) {
            throw new Error(`Icon file does not exist: ${absoluteIconPath}`);
        }

        try {
            switch (process.platform) {
                case 'win32':
                    return this.setFolderIconWindows(absoluteFolderPath, absoluteIconPath);
                case 'darwin':
                    return this.setFolderIconMacOS(absoluteFolderPath, absoluteIconPath);
                case 'linux':
                    return this.setFolderIconLinux(absoluteFolderPath, absoluteIconPath);
                default:
                    throw new Error(`Unsupported platform: ${process.platform}`);
            }
        } catch (error) {
            throw new Error(`Failed to set folder icon: ${error.message}`);
        }
    }

    setFolderIconWindows(folderPath, iconPath) {
        const desktopIni = path.join(folderPath, 'desktop.ini');

        this.clearWindowsAttributes(folderPath);
        if (fs.existsSync(desktopIni)) {
            this.clearWindowsAttributes(desktopIni);
            this.removeLegacyFolderIcon(folderPath, desktopIni);
        }

        const iniContent = `[.ShellClassInfo]
IconResource=${iconPath},0
[ViewState]
Mode=
Vid=
FolderType=Generic
`;
        fs.writeFileSync(desktopIni, iniContent);
        execSync(`attrib +H +S "${desktopIni}"`, { stdio: 'ignore' });
        execSync(`attrib +R "${folderPath}"`, { stdio: 'ignore' });
        this.refreshWindowsIcon(folderPath);

        console.log(`✓ Folder icon changed (Windows): ${folderPath}`);
        return true;
    }

    clearWindowsAttributes(target) {
        try {
            execSync(`attrib -H -S -R "${target}"`, { stdio: 'ignore' });
        } catch {
        }
    }

    removeLegacyFolderIcon(folderPath, desktopIni) {
        try {
            const content = fs.readFileSync(desktopIni, 'utf8');
            const match = content.match(/^IconResource=(.+?),\s*\d+\s*$/mi);
            if (!match) return;

            const ref = match[1].trim();
            if (path.isAbsolute(ref)) return;

            const oldIconPath = path.join(folderPath, ref);
            if (fs.existsSync(oldIconPath)) {
                this.clearWindowsAttributes(oldIconPath);
                fs.unlinkSync(oldIconPath);
            }
        } catch {
        }
    }

    refreshWindowsIcon(folderPath) {
        try {
            const psPath = folderPath.replace(/'/g, "''");
            const script = `Add-Type -Namespace SetIcon -Name Shell -MemberDefinition '[System.Runtime.InteropServices.DllImport("shell32.dll")] public static extern void SHChangeNotify(int eventId, uint flags, System.IntPtr item1, System.IntPtr item2);
[System.Runtime.InteropServices.DllImport("shell32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)] public static extern System.IntPtr ILCreateFromPath(string path);
[System.Runtime.InteropServices.DllImport("shell32.dll")] public static extern void ILFree(System.IntPtr pidl);'
$pidl = [SetIcon.Shell]::ILCreateFromPath('${psPath}')
if ($pidl -ne [System.IntPtr]::Zero) {
  [SetIcon.Shell]::SHChangeNotify(0x00002000, 0x0000, $pidl, [System.IntPtr]::Zero)
  [SetIcon.Shell]::ILFree($pidl)
}`;
            const encoded = Buffer.from(script, 'utf16le').toString('base64');
            execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { stdio: 'ignore' });
        } catch {
        }
    }

    setFolderIconMacOS(folderPath, iconPath) {
        const script = `ObjC.import('Cocoa');
var image = $.NSImage.alloc.initWithContentsOfFile(${JSON.stringify(iconPath)});
if (image.isNil()) { throw new Error('Failed to load icon: invalid image file'); }
var success = $.NSWorkspace.sharedWorkspace.setIconForFileOptions(image, ${JSON.stringify(folderPath)}, 0);
if (!success) { throw new Error('NSWorkspace returned false (try granting automation permission to Terminal)'); }`;

        try {
            execSync('osascript -l JavaScript -', { input: script, stdio: ['pipe', 'pipe', 'pipe'] });
        } catch (e) {
            const stderr = e.stderr ? e.stderr.toString().trim() : e.message;
            throw new Error(`osascript failed: ${stderr}`);
        }

        console.log(`✓ Folder icon changed (macOS): ${folderPath}`);
        return true;
    }

    setFolderIconLinux(folderPath, iconPath) {
        const applied = [];

        try {
            execSync(
                `gio set ${JSON.stringify(folderPath)} metadata::custom-icon ${JSON.stringify(`file://${iconPath}`)}`,
                { stdio: ['ignore', 'ignore', 'pipe'] }
            );
            applied.push('gio metadata (GNOME family)');
        } catch {
        }

        try {
            const dotDirectory = path.join(folderPath, '.directory');
            fs.writeFileSync(dotDirectory, `[Desktop Entry]\nIcon=${iconPath}\n`);
            applied.push('.directory file (KDE family)');
        } catch (e) {
        }

        if (applied.length === 0) {
            const desktop = process.env.XDG_CURRENT_DESKTOP || 'unknown';
            throw new Error(`No method worked on Linux (current desktop: ${desktop}). Install gio or use a KDE-compatible file manager.`);
        }

        console.log(`✓ Folder icon changed (Linux): ${folderPath}`);
        console.log(`  Methods: ${applied.join(' + ')}`);
        return true;
    }

    async processIconChange(folderPath, iconOrPngPath, dimensions = [16, 32, 48, 64, 128, 256]) {
        try {
            const ext = path.extname(iconOrPngPath).toLowerCase();
            let needsConversion = false;

            if (process.platform === 'win32') {
                if (ext === '.png') {
                    needsConversion = true;
                } else if (ext !== '.ico') {
                    throw new Error('On Windows, icon must be .ico or .png');
                }
            } else {
                const supported = ['.png', '.jpg', '.jpeg', '.ico', '.icns', '.gif', '.tiff', '.bmp', '.svg'];
                if (!supported.includes(ext)) {
                    throw new Error(`Unsupported icon format on ${process.platform}: ${ext}`);
                }
            }

            const { storePath, storeId } = await this.resolveStoredIcon(iconOrPngPath, needsConversion, dimensions);

            this.setFolderIcon(folderPath, storePath);
            this.trackUsage(storeId, path.resolve(folderPath));
            return true;
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return false;
        }
    }

    async resolveStoredIcon(sourcePath, needsConversion, sizes) {
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
            console.log('📸 PNG detected, converting to ICO...');
            await this.convertPngToIco(absSource, storePath, sizes);
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

    trackUsage(storeId, folderAbs) {
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

    showHelp(lang = getLanguage()) {
        const version = getVersion();
        const help = {
            en: `
📁 SETICON - User manual
${'='.repeat(34)}

📋 DESCRIPTION:
   Cross-platform command-line utility (Windows, macOS, Linux) to change
   folder icons, with automatic PNG → ICO conversion on Windows when needed.

🎯 USAGE:
   seticon [OPTIONS] [COMMANDS]

📝 COMMANDS:
   set              Set a folder icon
   convert          Convert PNG to ICO
   help, --help, -h Show this manual

⚙️  MAIN OPTIONS:
   -f, --folder <path>     Target folder path
   -i, --icon <path>       Icon file path (.ico or .png)
   -o, --output <path>     Output file for conversion
   -s, --sizes <sizes>     Icon sizes (e.g. 16,32,48,64,128,256)
   -l, --lang <code>       Set and remember the interface language (en, fr)
   -v, --verbose           Verbose mode
   -h, --help              Show this help

📋 EXAMPLES:

   1. Set a folder icon from an ICO file:
      seticon set -f "./MyFolder" -i "./icon.ico"
      seticon set --folder "C:\\Users\\Docs" --icon "icon.ico"

   2. Set a folder icon from a PNG (auto-converted):
      seticon set -f "./Project" -i "./logo.png"
      seticon set --folder "./Images" --icon "./favicon.png" --sizes 16,32,48

   3. Convert PNG to ICO only:
      seticon convert -i "./image.png" -o "./icon.ico"
      seticon convert --icon "logo.png" --output "logo.ico" --sizes 16,32,64,128

   4. Shorthand syntax (positional arguments):
      seticon "./MyFolder" "./icon.png"
      seticon convert "./image.png" "./icon.ico"

   5. Switch the language (remembered for next runs):
      seticon --lang fr
      seticon -l en

🔧 FEATURES:
   ✓ Cross-platform support: Windows, macOS, Linux
   ✓ Multi-size PNG → ICO conversion (Windows only)
   ✓ Automatic desktop environment detection (GNOME/KDE)
   ✓ Automatic temporary file cleanup
   ✓ Comprehensive error handling

📁 SUPPORTED FORMATS:
   Input (Windows): PNG, ICO
   Input (macOS):   PNG, JPG, ICNS, GIF, TIFF, BMP, ICO
   Input (Linux):   PNG, JPG, SVG, ICO, GIF, TIFF, BMP
   Convert output:  ICO (16, 32, 48, 64, 128, 256 px)

🖥️  PER-PLATFORM BEHAVIOR:
   Windows  → Creates desktop.ini + applies +H +S +R attributes
   macOS    → Uses NSWorkspace.setIcon via osascript (Finder)
   Linux    → gio set metadata::custom-icon (GNOME) + .directory (KDE)

⚠️  IMPORTANT NOTES:
   • On Windows, PNG → ICO conversion is automatic when needed
   • On macOS/Linux, the PNG is used directly (no ICO needed)
   • macOS will ask for Finder automation permission on first run
   • On Linux, refresh Nautilus (F5) if the icon does not appear right away
   • Linux/tmpfs (e.g. /tmp): gio metadata is unsupported, only .directory works

🆘 HELP AND SUPPORT:
   For more information: seticon --help
   Version: ${version}
        `,
            fr: `
📁 SETICON - Manuel d'utilisation
${'='.repeat(34)}

📋 DESCRIPTION:
   Utilitaire en ligne de commande cross-platform (Windows, macOS, Linux)
   pour changer les icônes de dossiers, avec conversion PNG → ICO sur
   Windows si nécessaire.

🎯 UTILISATION:
   seticon [OPTIONS] [COMMANDES]

📝 COMMANDES:
   set              Définir l'icône d'un dossier
   convert          Convertir PNG vers ICO
   help, --help, -h Afficher ce manuel

⚙️  OPTIONS PRINCIPALES:
   -f, --folder <path>     Chemin du dossier cible
   -i, --icon <path>       Chemin du fichier icône (.ico ou .png)
   -o, --output <path>     Fichier de sortie pour conversion
   -s, --sizes <sizes>     Tailles d'icône (ex: 16,32,48,64,128,256)
   -l, --lang <code>       Définir et mémoriser la langue de l'interface (en, fr)
   -v, --verbose          Mode verbeux
   -h, --help             Afficher l'aide

📋 EXEMPLES D'UTILISATION:

   1. Changer l'icône d'un dossier avec un fichier ICO:
      seticon set -f "./MonDossier" -i "./icone.ico"
      seticon set --folder "C:\\Users\\Docs" --icon "icon.ico"

   2. Changer l'icône avec un PNG (conversion automatique):
      seticon set -f "./Projet" -i "./logo.png"
      seticon set --folder "./Images" --icon "./favicon.png" --sizes 16,32,48

   3. Convertir PNG vers ICO uniquement:
      seticon convert -i "./image.png" -o "./icone.ico"
      seticon convert --icon "logo.png" --output "logo.ico" --sizes 16,32,64,128

   4. Syntaxe simplifiée (rétrocompatibilité):
      seticon "./MonDossier" "./icone.png"
      seticon convert "./image.png" "./icon.ico"

   5. Changer la langue (mémorisée pour les prochaines exécutions):
      seticon --lang fr
      seticon -l en

🔧 FONCTIONNALITÉS:
   ✓ Support cross-platform : Windows, macOS, Linux
   ✓ Conversion PNG → ICO multi-tailles (Windows uniquement)
   ✓ Détection automatique de l'environnement de bureau (GNOME/KDE)
   ✓ Nettoyage automatique des fichiers temporaires
   ✓ Gestion d'erreurs complète

📁 FORMATS SUPPORTÉS:
   Entrée (Windows): PNG, ICO
   Entrée (macOS):   PNG, JPG, ICNS, GIF, TIFF, BMP, ICO
   Entrée (Linux):   PNG, JPG, SVG, ICO, GIF, TIFF, BMP
   Sortie convert:   ICO (16, 32, 48, 64, 128, 256 px)

🖥️  COMPORTEMENT PAR PLATEFORME:
   Windows  → Crée desktop.ini + applique attributs +H +S +R
   macOS    → Utilise NSWorkspace.setIcon via osascript (Finder)
   Linux    → gio set metadata::custom-icon (GNOME) + .directory (KDE)

⚠️  NOTES IMPORTANTES:
   • Sur Windows, la conversion PNG → ICO est automatique si nécessaire
   • Sur macOS/Linux, le PNG est utilisé directement (pas besoin d'ICO)
   • macOS demandera une permission pour automatiser Finder au 1er lancement
   • Sur Linux, redémarre Nautilus (F5) si l'icône n'apparaît pas tout de suite
   • Linux/tmpfs (ex: /tmp) : gio metadata n'est pas supporté, seul .directory marche

🆘 AIDE ET SUPPORT:
   Pour plus d'informations: seticon --help
   Version: ${version}
        `
        };
        console.log(help[lang] || help.en);
    }

    cleanup() {
        try {
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir);
                files.forEach(file => {
                    const filePath = path.join(this.tempDir, file);
                    if (file.startsWith('converted_') && file.endsWith('.ico')) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
        } catch (error) {
        }
    }
}

function parseArguments(args) {
    const options = {
        command: null,
        folder: null,
        icon: null,
        output: null,
        sizes: [16, 32, 48, 64, 128, 256],
        verbose: false,
        help: false,
        lang: null
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '--help':
            case '-h':
            case 'help':
                options.help = true;
                break;
            case '--folder':
            case '-f':
                options.folder = nextArg;
                i++;
                break;
            case '--icon':
            case '-i':
                options.icon = nextArg;
                i++;
                break;
            case '--output':
            case '-o':
                options.output = nextArg;
                i++;
                break;
            case '--sizes':
            case '-s':
                if (nextArg) {
                    options.sizes = nextArg.split(',').map(s => parseInt(s.trim()));
                    i++;
                }
                break;
            case '--lang':
            case '-l':
                if (nextArg) {
                    options.lang = nextArg.toLowerCase();
                    i++;
                }
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case 'set':
            case 'convert':
                options.command = arg;
                break;
            default:
                if (!arg.startsWith('-') && !options.command) {
                    if (args.length >= 2 && !options.folder) {
                        options.command = 'set';
                        options.folder = arg;
                        options.icon = nextArg;
                        i++;
                    } else if (arg === 'convert' || (args.length === 3 && !options.command)) {
                        options.command = 'convert';
                        if (arg !== 'convert') {
                            options.icon = arg;
                            options.output = nextArg;
                            i++;
                        }
                    }
                }
                break;
        }
    }

    return options;
}

async function main() {
    const cli = new FolderIconCLI();
    const args = process.argv.slice(2);
    const options = parseArguments(args);

    process.on('exit', () => cli.cleanup());
    process.on('SIGINT', () => cli.cleanup());
    process.on('SIGTERM', () => cli.cleanup());

    if (options.verbose) {
        console.log('🔧 Options:', options);
    }

    if (options.lang) {
        if (!SUPPORTED_LANGUAGES.includes(options.lang)) {
            console.error(`❌ Unsupported language: ${options.lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
            process.exit(1);
        }
        const config = loadConfig();
        config.lang = options.lang;
        saveConfig(config);
        console.log(options.lang === 'fr'
            ? '✓ Langue définie : Français (fr)'
            : '✓ Language set to: English (en)');

        if (!options.command && !options.help && !options.folder && !options.icon) {
            return;
        }
    }

    if (args.length === 0 || options.help) {
        cli.showHelp();
        return;
    }

    try {
        if (options.command === 'convert') {
            if (args[0] === 'convert' && args.length === 3) {
                const [, pngPath, icoPath] = args;
                options.icon = pngPath;
                options.output = icoPath;
            }
            
            if (!options.icon || !options.output) {
                console.error('❌ Convert command requires --icon and --output parameters');
                console.log('💡 Example: seticon convert -i "image.png" -o "icon.ico"');
                process.exit(1);
            }
            
            await cli.convertPngToIco(options.icon, options.output, options.sizes);
            console.log(`✓ PNG converted to ICO: ${options.output}`);
            
        } else if (options.command === 'set') {
            if (!options.folder || !options.icon) {
                console.error('❌ Set command requires --folder and --icon parameters');
                console.log('💡 Example: seticon set -f "./MyFolder" -i "icon.png"');
                process.exit(1);
            }
            
            const success = await cli.processIconChange(options.folder, options.icon, options.sizes);
            process.exit(success ? 0 : 1);
            
        } else {
            console.error('❌ Invalid command. Use --help for usage information.');
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
});

export default FolderIconCLI;