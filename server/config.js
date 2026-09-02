/* =============================================================================
 *  server/config.js — đọc cấu hình từ public/metadata.js
 * -----------------------------------------------------------------------------
 *  metadata.js được viết cho trình duyệt (dùng `window`), nên ta chạy nó trong
 *  một sandbox có `window` giả. Nhờ vậy WEB và SERVER dùng chung 1 file cấu hình,
 *  không bao giờ bị lệch nhau.
 * ===========================================================================*/
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function cliArg(name) {
    const i = process.argv.indexOf(name);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

/** Thư mục phát web — mặc định ./public */
const PUBLIC_DIR = path.resolve(ROOT, process.env.PUBLIC_DIR || cliArg('--public') || './public');
const META_FILE = path.join(PUBLIC_DIR, 'metadata.js');

function loadMetadata() {
    if (!fs.existsSync(META_FILE)) {
        console.error('❌ Không tìm thấy ' + path.relative(ROOT, META_FILE));
        console.error('   (đổi thư mục web bằng: PUBLIC_DIR=./khac node server.js)');
        process.exit(1);
    }
    const sandbox = { window: {}, console };
    vm.runInNewContext(fs.readFileSync(META_FILE, 'utf8') + '\n;__CFG = window.WEDDING_CONFIG;', sandbox);
    if (!sandbox.__CFG) {
        console.error('❌ metadata.js không định nghĩa window.WEDDING_CONFIG');
        process.exit(1);
    }
    return sandbox.__CFG;
}

const CFG = loadMetadata();

const SERVER = Object.assign({
    host: '0.0.0.0',
    port: 8080,
    dataDir: './data',
    perPage: 10,
    maxCommentLength: 1000,
    maxNameLength: 50,
    corsOrigin: '*',
    rateLimitPerMinute: 30
}, CFG.server || {});

const DATA_DIR = path.resolve(ROOT, SERVER.dataDir);

module.exports = {
    ROOT,
    PUBLIC_DIR,
    DATA_DIR,
    DB_FILE: path.join(DATA_DIR, 'db.json'),
    CRED_FILE: path.join(DATA_DIR, 'credentials.txt'),
    META_FILE,
    CFG,
    SERVER,
    HOST: process.env.HOST || cliArg('--host') || SERVER.host,
    PORT: Number(process.env.PORT || cliArg('--port') || SERVER.port),
    GUEST_KEY: (CFG.backend && CFG.backend.guestKey) || 'public-guest',
    cliArg
};
