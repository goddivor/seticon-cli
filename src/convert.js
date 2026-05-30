import fs from 'fs';
import os from 'os';
import path from 'path';

function getTempDir() {
    const dir = path.join(os.tmpdir(), 'seticon');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export async function convertPngToIco(pngPath, icoPath, sizes = [16, 32, 48, 64, 128, 256]) {
    const tempDir = getTempDir();
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
            const tempPath = path.join(tempDir, `resize_${runId}_${size}.png`);
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
