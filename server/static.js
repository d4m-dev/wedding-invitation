/* =============================================================================
 *  server/static.js — phát file tĩnh
 * -----------------------------------------------------------------------------
 *  CHỈ phát nội dung trong PUBLIC_DIR (thư mục public/). Source code backend,
 *  data/db.json, .git, .env... nằm ngoài đó nên không thể tải được qua web.
 * ===========================================================================*/
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { PUBLIC_DIR, DATA_DIR, ROOT } = require('./config');
const { MIME } = require('./http');

// đuôi file được cache lâu (ảnh/nhạc/video/font)
const CACHEABLE = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.m4a', '.mp4', '.webm', '.woff2', '.ico'];

function deny(res, code, message) {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
}

function serve(req, res, parsed) {
    let pathname;
    try {
        pathname = decodeURIComponent(parsed.pathname);
    } catch {
        return deny(res, 400, '400 Đường dẫn không hợp lệ');
    }
    if (pathname.includes('\0')) return deny(res, 400, '400 Đường dẫn không hợp lệ');
    if (pathname.endsWith('/')) pathname += 'index.html';

    const target = path.resolve(PUBLIC_DIR, '.' + path.posix.normalize(pathname));

    // 1) không cho thoát khỏi thư mục web (../../etc/passwd)
    if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + path.sep)) {
        return deny(res, 403, '403 Forbidden');
    }
    // 2) không cho tải thư mục dữ liệu
    if (target.startsWith(DATA_DIR + path.sep) || target === DATA_DIR) {
        return deny(res, 403, '403 Forbidden');
    }
    // 3) không phát file ẩn (.git, .env, .gitignore...) kể cả khi lọt vào public/
    if (target.slice(PUBLIC_DIR.length).split(path.sep).some(part => part.startsWith('.') && part.length > 1)) {
        return deny(res, 403, '403 Forbidden');
    }

    fs.stat(target, (err, stat) => {
        if (err || !stat.isFile()) {
            return deny(res, 404, '404 Không tìm thấy: ' + pathname);
        }
        const ext = path.extname(target).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': CACHEABLE.includes(ext) ? 'public, max-age=86400' : 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        });
        fs.createReadStream(target).pipe(res);
    });
}

module.exports = { serve, PUBLIC_DIR, ROOT };
