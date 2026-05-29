#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const iconFileName = path.basename(iconPath);
        const iconInFolder = path.join(folderPath, iconFileName);

        fs.copyFileSync(iconPath, iconInFolder);
        execSync(`attrib +H +S "${iconInFolder}"`, { stdio: 'ignore' });

        const iniContent = `[.ShellClassInfo]
IconResource=${iconFileName},0
[ViewState]
Mode=
Vid=
FolderType=Generic
`;
        fs.writeFileSync(desktopIni, iniContent);
        execSync(`attrib +H +S "${desktopIni}"`, { stdio: 'ignore' });
        execSync(`attrib +R "${folderPath}"`, { stdio: 'ignore' });

        console.log(`✓ Folder icon changed (Windows): ${folderPath}`);
        return true;
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
            let iconPath = iconOrPngPath;

            if (process.platform === 'win32') {
                if (ext === '.png') {
                    console.log('📸 PNG detected, converting to ICO for Windows...');
                    const tempIcoPath = path.join(this.tempDir, `converted_${Date.now()}.ico`);
                    iconPath = await this.convertPngToIco(iconOrPngPath, tempIcoPath, dimensions);
                    console.log(`✓ PNG converted to ICO: ${iconPath}`);
                } else if (ext !== '.ico') {
                    throw new Error('On Windows, icon must be .ico or .png');
                }
            } else {
                const supported = ['.png', '.jpg', '.jpeg', '.ico', '.icns', '.gif', '.tiff', '.bmp', '.svg'];
                if (!supported.includes(ext)) {
                    throw new Error(`Unsupported icon format on ${process.platform}: ${ext}`);
                }
            }

            this.setFolderIcon(folderPath, iconPath);
            return true;
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return false;
        }
    }

    showHelp() {
        console.log(`
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
   Version: 1.0.0
        `);
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
        help: false
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