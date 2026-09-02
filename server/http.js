/* =============================================================================
 *  server/http.js — tiện ích HTTP dùng chung
 * ===========================================================================*/
'use strict';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8'
};

function json(res, status, payload, corsOrigin) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Access-Control-Allow-Origin': corsOrigin || '*',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function readBody(req, limit = 256 * 1024) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', c => {
            size += c.length;
            if (size > limit) { reject(new Error('Payload quá lớn')); req.destroy(); return; }
            chunks.push(c);
        });
        req.on('end', () => {
            if (!chunks.length) return resolve({});
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
            catch { reject(new Error('JSON không hợp lệ')); }
        });
        req.on('error', reject);
    });
}

function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
    const addr = req.socket.remoteAddress || '';
    return addr.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
}

module.exports = { MIME, json, readBody, clientIp };
