/* =============================================================================
 *  server/auth.js — token quản trị + khoá khách + chống spam
 * -----------------------------------------------------------------------------
 *  Token quản trị có đúng 3 phần ngăn bởi dấu chấm, vì dist/admin.js kiểm tra
 *  `String(token).split(".").length === 3` để biết người dùng có phải admin.
 *  Khoá khách (1 phần) được gửi qua header `x-access-key` — đúng như
 *  dist/guest.js vẫn làm.
 * ===========================================================================*/
'use strict';

const crypto = require('node:crypto');

const b64url = (input) => Buffer.from(input).toString('base64url');

function signToken(payload, secret) {
    const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', secret).update(head + '.' + body).digest('base64url');
    return head + '.' + body + '.' + sig;
}

function verifyToken(token, secret) {
    if (!token) return null;
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const expect = crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest('base64url');
    const a = Buffer.from(expect);
    const b = Buffer.from(parts[2]);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return payload.exp > Date.now() ? payload : null;
    } catch {
        return null;
    }
}

/** Quản trị: header `Authorization: Bearer <token>` */
function adminOf(req, secret) {
    const auth = req.headers['authorization'] || '';
    return auth.startsWith('Bearer ') ? verifyToken(auth.slice(7), secret) : null;
}

/** Khách: header `x-access-key` hoặc query `?key=` / `?k=` */
function guestAllowed(req, query, guestKey) {
    const key = req.headers['x-access-key'] || query.get('key') || query.get('k');
    return key === guestKey;
}

/* --------------------------- chống spam theo IP --------------------------- */
const hits = new Map();

function rateLimited(ip, perMinute) {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < 60000);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 500) hits.clear();
    return list.length > perMinute;
}

module.exports = { signToken, verifyToken, adminOf, guestAllowed, rateLimited };
