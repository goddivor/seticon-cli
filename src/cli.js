import { SUPPORTED_LANGUAGES, loadConfig, saveConfig } from './config.js';
import { showHelp } from './help.js';
import { processIconChange } from './icon.js';
import { convertToIco } from './convert.js';

export function parseArguments(args) {
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

export async function main() {
    const args = process.argv.slice(2);
    const options = parseArguments(args);

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
        showHelp();
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

            await convertToIco(options.icon, options.output, options.sizes);
            console.log(`✓ Image converted to ICO: ${options.output}`);

        } else if (options.command === 'set') {
            if (!options.folder || !options.icon) {
                console.error('❌ Set command requires --folder and --icon parameters');
                console.log('💡 Example: seticon set -f "./MyFolder" -i "icon.png"');
                process.exit(1);
            }

            const success = await processIconChange(options.folder, options.icon, options.sizes);
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
