/* =============================================================================
 *  server/db.js — "database" 1 file JSON (data/db.json)
 * -----------------------------------------------------------------------------
 *  Với một đám cưới (vài trăm lời chúc) thì 1 file JSON là đủ nhanh và cực kỳ
 *  dễ sao lưu. Ghi file theo kiểu an toàn: ghi ra file .tmp rồi rename, nên mất
 *  điện giữa chừng cũng không làm hỏng dữ liệu cũ.
 * ===========================================================================*/
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, DATA_DIR, DB_FILE, CRED_FILE, CFG } = require('./config');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** store.data là toàn bộ nội dung db.json */
const store = { data: null };

/* ------------------------------ mật khẩu --------------------------------- */
function hashPassword(password, salt) {
    salt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, {
        N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p
    }).toString('hex');
    return { algo: 'scrypt', N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, keylen: SCRYPT.keylen, salt, hash };
}

function verifyPassword(password, record) {
    if (!record || !record.hash) return false;
    const calc = crypto.scryptSync(String(password), record.salt, record.keylen, {
        N: record.N, r: record.r, p: record.p
    });
    const known = Buffer.from(record.hash, 'hex');
    return calc.length === known.length && crypto.timingSafeEqual(calc, known);
}

/* ------------------------------ khởi tạo --------------------------------- */
function newDb() {
    return {
        version: 1,
        created_at: new Date().toISOString(),
        meta: {
            secret: crypto.randomBytes(48).toString('hex'),      // ký token quản trị
            access_key: crypto.randomBytes(16).toString('hex'),
            secret_rotated: 0
        },
        user: null,
        comments: [],
        likes: []
    };
}

function createDefaultAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@wedding.local';
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    store.data.user = {
        name: (CFG.wedding && CFG.wedding.groom && CFG.wedding.groom.fullName) || 'Administrator',
        email,
        password: hashPassword(password),
        access_key: crypto.randomBytes(12).toString('hex'),
        tenor_key: null,
        created_at: new Date().toISOString()
    };
    const text = [
        '# Tài khoản quản trị dashboard.html (tạo lúc ' + new Date().toLocaleString('vi-VN') + ')',
        'Email   : ' + email,
        'Password: ' + password,
        '',
        'Đổi mật khẩu ngay sau khi đăng nhập (dashboard.html > Cài đặt).',
        'File này chỉ nên nằm trên máy chủ, KHÔNG push lên git.'
    ].join('\n');
    fs.writeFileSync(CRED_FILE, text, { mode: 0o600 });
    console.log('\n' + '─'.repeat(62));
    console.log('  🔑 TÀI KHOẢN QUẢN TRỊ (dashboard.html) — lưu lại ngay!');
    console.log('     Email   : ' + email);
    console.log('     Password: ' + password);
    console.log('     Đã ghi vào ' + path.relative(ROOT, CRED_FILE));
    console.log('─'.repeat(62) + '\n');
}

/* ------------------------------ đọc / ghi -------------------------------- */
function load() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
        try {
            store.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            if (!Array.isArray(store.data.comments)) store.data.comments = [];
            if (!Array.isArray(store.data.likes)) store.data.likes = [];
            console.log(`✅ Đã nạp ${path.relative(ROOT, DB_FILE)}: ` +
                `${store.data.comments.length} lời chúc, ${store.data.likes.length} lượt thích`);
            return store.data;
        } catch (err) {
            const backup = DB_FILE + '.corrupt-' + Date.now();
            fs.renameSync(DB_FILE, backup);
            console.error('⚠️  db.json hỏng, đã đổi tên thành ' + path.basename(backup) + ' — ' + err.message);
        }
    }
    store.data = newDb();
    createDefaultAdmin();
    save();
    return store.data;
}

function save() {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store.data, null, 2));
    fs.renameSync(tmp, DB_FILE);   // rename là thao tác nguyên tử trên cùng filesystem
}

module.exports = { store, load, save, hashPassword, verifyPassword };
