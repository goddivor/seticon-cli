import { getVersion, getLanguage } from './config.js';

export function showHelp(lang = getLanguage()) {
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
   -i, --icon <path>       Icon/image path (ico, png, jpg, bmp, tif, webp, svg)
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
   ✓ Content-addressed icon cache with deduplication
   ✓ Comprehensive error handling

📁 SUPPORTED FORMATS:
   Input:           ICO, PNG, JPG, JPEG, BMP, TIF, TIFF, WEBP, SVG
   Kept as-is:      PNG, ICO
   Auto-converted:  JPG, JPEG, BMP, TIF, TIFF, WEBP, SVG → ICO
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
   -i, --icon <path>       Chemin de l'icône/image (ico, png, jpg, bmp, tif, webp, svg)
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
   ✓ Cache d'icônes adressé par contenu avec déduplication
   ✓ Gestion d'erreurs complète

📁 FORMATS SUPPORTÉS:
   Entrée :          ICO, PNG, JPG, JPEG, BMP, TIF, TIFF, WEBP, SVG
   Gardés tels quels: PNG, ICO
   Convertis auto :  JPG, JPEG, BMP, TIF, TIFF, WEBP, SVG → ICO
   Sortie convert :  ICO (16, 32, 48, 64, 128, 256 px)

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
