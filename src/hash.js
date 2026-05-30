import crypto from 'crypto';

export function sha256Hex(buffer) {
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

export function ed2kHex(buffer) {
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
