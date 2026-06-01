import fs from 'fs';
import os from 'os';
import path from 'path';

const SHARP_DECODABLE = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.svg'];

function getTempDir() {
    const dir = path.join(os.tmpdir(), 'seticon');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

async function loadSharpSource(sourcePath) {
    const ext = path.extname(sourcePath).toLowerCase();
    if (ext === '.bmp') {
        const { default: decodeBmp } = await import('decode-bmp');
        const buffer = fs.readFileSync(sourcePath);
        const img = decodeBmp(Uint8Array.from(buffer));
        return { input: Buffer.from(img.data), options: { raw: { width: img.width, height: img.height, channels: 4 } } };
    }
    if (SHARP_DECODABLE.includes(ext)) {
        return { input: sourcePath, options: undefined };
    }
    throw new Error(`Cannot convert ${ext} to ICO`);
}

export async function convertToIco(sourcePath, icoPath, sizes = [16, 32, 48, 64, 128, 256]) {
    const tempDir = getTempDir();
    const tempPaths = [];
    try {
        const { default: sharp } = await import('sharp');
        const { default: pngToIco } = await import('png-to-ico');
        const source = await loadSharpSource(sourcePath);

        const runId = `${Date.now()}_${process.pid}`;
        for (const size of sizes) {
            const buffer = await sharp(source.input, source.options)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toBuffer();
            const tempPath = path.join(tempDir, `resize_${runId}_${size}.png`);
            fs.writeFileSync(tempPath, buffer);
            tempPaths.push(tempPath);
        }

        const icoBuffer = await pngToIco(tempPaths);
        fs.writeFileSync(icoPath, icoBuffer);
        return icoPath;
    } catch (error) {
        throw new Error(`Failed to convert image to ICO: ${error.message}`);
    } finally {
        for (const tempPath of tempPaths) {
            try { fs.unlinkSync(tempPath); } catch {}
        }
    }
}
