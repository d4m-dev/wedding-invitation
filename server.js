#!/usr/bin/env node
/* =============================================================================
 *  server.js — ĐIỂM KHỞI ĐỘNG backend thiệp cưới
 * =============================================================================
 *  KHÔNG cần `npm install`: chỉ dùng module có sẵn của Node (http, fs, crypto).
 *  Chạy được trên Termux (Android), Windows, macOS, Linux, Raspberry Pi.
 *
 *      node server.js                    mặc định 0.0.0.0:8080
 *      node server.js --port 3000        đổi cổng
 *      PORT=3000 node server.js          đổi cổng qua biến môi trường
 *      PUBLIC_DIR=./khac node server.js  đổi thư mục web
 *      npm start                         tương đương node server.js
 *
 *  Cấu trúc:
 *      server/config.js   đọc cấu hình từ public/metadata.js
 *      server/db.js       data/db.json (lời chúc, tài khoản)
 *      server/auth.js     token quản trị, khoá khách, chống spam
 *      server/api.js      các route /api/*
 *      server/static.js   phát file trong public/
 *      server/http.js     tiện ích dùng chung
 *
 *  Node tối thiểu: v18
 * ===========================================================================*/
'use strict';

const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const { ROOT, PUBLIC_DIR, DB_FILE, HOST, PORT } = require('./server/config');
const db = require('./server/db');
const api = require('./server/api');
const staticServer = require('./server/static');
const { json } = require('./server/http');

const MIN_NODE = 18;
const major = Number(process.versions.node.split('.')[0]);
if (major < MIN_NODE) {
    console.error(`❌ Cần Node v${MIN_NODE} trở lên (đang chạy v${process.versions.node})`);
    process.exit(1);
}

db.load();

const server = http.createServer(async (req, res) => {
    const parsed = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    try {
        if (parsed.pathname.startsWith('/api/')) return await api.handle(req, res, parsed);
        return staticServer.serve(req, res, parsed);
    } catch (err) {
        console.error('❌ ' + err.message);
        if (!res.headersSent) json(res, 500, { data: { message: err.message } }, '*');
        else res.end();
    }
});

server.listen(PORT, HOST, () => {
    const shown = HOST === '0.0.0.0' ? '<IP-của-máy>' : HOST;
    console.log('\n💒 Backend thiệp cưới đã chạy!');
    console.log('   Node        : v' + process.versions.node);
    console.log(`   Địa chỉ     : http://${shown}:${PORT}`);
    console.log(`   Trên máy này: http://127.0.0.1:${PORT}`);
    console.log('   Web root    : ' + path.relative(ROOT, PUBLIC_DIR) + '/');
    console.log('   Dữ liệu     : ' + path.relative(ROOT, DB_FILE));
    console.log('   Cấu hình    : ' + path.relative(ROOT, require('./server/config').META_FILE) + '\n');

    const nets = Object.values(os.networkInterfaces()).flat()
        .filter(n => n && n.family === 'IPv4' && !n.internal);
    nets.forEach(n => console.log(`   📱 Máy khác trong cùng WiFi mở: http://${n.address}:${PORT}`));
    if (nets.length) console.log('');
});

const stop = () => {
    console.log('\n👋 Đang dừng...');
    try { db.save(); } catch (e) { console.error('⚠️  Không lưu được db: ' + e.message); }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
