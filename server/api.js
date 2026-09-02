/* =============================================================================
 *  server/api.js — các route /api/*
 * -----------------------------------------------------------------------------
 *  Định dạng request/response khớp CHÍNH XÁC những gì public/js/guest.js và
 *  public/js/admin.js đang gọi:
 *
 *    GET    /api/session?key=        -> {code:200, data:{token}}          (khoá khách)
 *    POST   /api/session             -> {code:200, data:{token}}          (đăng nhập admin)
 *    GET    /api/v2/config           -> {code:200, data:{can_reply,...}}
 *    GET    /api/v2/comment?per&next -> {code:200, data:{count, lists}}
 *    POST   /api/comment             -> 201 {code:201, data:{...comment, own}}
 *    POST   /api/comment/:uuid       -> 201 {code:201, data:{uuid:likeId}} (thích)
 *    PATCH  /api/comment/:likeId     -> {data:{status:true}}               (bỏ thích)
 *    PUT    /api/comment/:uuid       -> {data:{status:true}}               (sửa)
 *    DELETE /api/comment/:uuid       -> {data:{status:true}}               (xoá + trả lời)
 *    GET    /api/user   PUT /api/user                                     (admin)
 *    GET    /api/stats  POST /api/key  GET /api/download                  (admin)
 *    GET    /api/health                                                   (công khai)
 * ===========================================================================*/
'use strict';

const crypto = require('node:crypto');
const { CFG, SERVER, GUEST_KEY } = require('./config');
const { store, save, hashPassword, verifyPassword } = require('./db');
const auth = require('./auth');
const { json, readBody, clientIp } = require('./http');

const db = () => store.data;

/* ------------------- ánh xạ dữ liệu -> định dạng client cần --------------- */
function mapOne(c, ip, admin) {
    return {
        uuid: c.uuid,
        name: c.name,
        presence: c.presence,
        comment: c.comment,
        ip: c.ip_address,
        user_agent: c.user_agent,
        is_admin: !!c.is_admin,
        is_parent: !c.parent_uuid,
        gif_url: c.gif_url || null,
        created_at: c.created_at,
        like_count: db().likes.filter(l => l.comment_uuid === c.uuid).length,
        comments: [],
        own: !!admin || c.ip_address === ip
    };
}

function mapComment(c, ip, admin) {
    const replies = db().comments
        .filter(r => r.parent_uuid === c.uuid)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(r => Object.assign({}, mapOne(r, ip, admin), { is_parent: false, comments: [] }));
    return Object.assign({}, mapOne(c, ip, admin), { is_parent: true, comments: replies });
}

function toCsv() {
    const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const head = ['uuid', 'parent_uuid', 'name', 'presence', 'comment',
        'ip_address', 'user_agent', 'is_admin', 'created_at', 'like_count'];
    const rows = db().comments
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(c => [
            c.uuid, c.parent_uuid || '', c.name, c.presence, c.comment,
            c.ip_address, c.user_agent, c.is_admin ? 1 : 0, c.created_at,
            db().likes.filter(l => l.comment_uuid === c.uuid).length
        ].map(esc).join(','));
    return '\ufeff' + [head.join(','), ...rows].join('\r\n');   // BOM để Excel đọc đúng tiếng Việt
}

function normalizePresence(value) {
    if (typeof value === 'boolean') return value ? 1 : 2;
    if (value == null) return 0;
    return parseInt(value, 10) || 0;
}

/* ------------------------------- sửa lời chúc ----------------------------- */
function updateComment(id, body, admin, ip, res) {
    const target = db().comments.find(c => c.uuid === id);
    if (!target) return json(res, 404, { data: { status: false, message: 'Không thấy lời chúc' } }, SERVER.corsOrigin);
    if (!admin && target.ip_address !== ip) {
        return json(res, 403, { data: { status: false, message: 'Không có quyền sửa' } }, SERVER.corsOrigin);
    }
    if (body.comment !== undefined && body.comment !== null) {
        const text = String(body.comment).trim().slice(0, SERVER.maxCommentLength);
        if (!text) return json(res, 400, { data: { status: false, message: 'Lời chúc không được để trống' } }, SERVER.corsOrigin);
        target.comment = text;
    }
    if (body.gif_id !== undefined) target.gif_url = body.gif_id || null;
    if (body.gif_url !== undefined) target.gif_url = body.gif_url || null;
    if (body.presence !== undefined && body.presence !== null) target.presence = normalizePresence(body.presence);
    target.updated_at = new Date().toISOString();
    save();
    return json(res, 200, { code: 200, data: { status: true } }, SERVER.corsOrigin);
}

/* --------------------------------- router --------------------------------- */
async function handle(req, res, parsed) {
    const q = parsed.searchParams;
    const route = parsed.pathname.replace(/\/+$/, '') || '/';
    const method = req.method.toUpperCase();
    const ip = clientIp(req);
    const secret = db().meta.secret;
    const admin = auth.adminOf(req, secret);
    const send = (status, payload) => json(res, status, payload, SERVER.corsOrigin);

    res.setHeader('Access-Control-Allow-Origin', SERVER.corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, x-access-key, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    /* ---- health ---- */
    if (route === '/api/health') {
        return send(200, {
            code: 200,
            data: {
                status: 'ok', node: process.versions.node, uptime: Math.round(process.uptime()),
                comments: db().comments.length, likes: db().likes.length
            }
        });
    }

    /* ---- session ---- */
    if (route === '/api/session') {
        if (method === 'GET') {
            if (!auth.guestAllowed(req, q, GUEST_KEY)) return send(401, { data: { message: 'Khoá truy cập không đúng' } });
            return send(200, { code: 200, data: { token: GUEST_KEY } });
        }
        if (method === 'POST') {
            const body = await readBody(req);
            if (auth.rateLimited(ip, SERVER.rateLimitPerMinute)) {
                return send(429, { data: { message: 'Quá nhiều lần đăng nhập, thử lại sau' } });
            }
            const ok = db().user && body.email === db().user.email && verifyPassword(body.password, db().user.password);
            if (!ok) return send(401, { data: { message: 'Email hoặc mật khẩu không đúng' } });
            const token = auth.signToken({ sub: db().user.email, exp: Date.now() + 1000 * 60 * 60 * 12 }, secret);
            console.log('🔐 Đăng nhập quản trị: ' + body.email + ' từ ' + ip);
            return send(200, { code: 200, data: { token } });
        }
    }

    /* ---- config công khai ---- */
    if (route === '/api/v2/config' && method === 'GET') {
        return send(200, {
            code: 200,
            data: {
                can_reply: true,
                can_edit: !!admin,
                can_delete: !!admin,
                tenor_key: (CFG.thirdParty && CFG.thirdParty.gif && CFG.thirdParty.gif.apiKey)
                    || db().user?.tenor_key || null
            }
        });
    }

    /* ---- danh sách lời chúc ---- */
    if (route === '/api/v2/comment' && method === 'GET') {
        const per = Math.min(50, Math.max(1, parseInt(q.get('per'), 10) || SERVER.perPage));
        const next = Math.max(0, parseInt(q.get('next'), 10) || 0);
        const parents = db().comments
            .filter(c => !c.parent_uuid)
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
        const lists = parents.slice(next * per, next * per + per).map(c => mapComment(c, ip, admin));
        return send(200, { code: 200, data: { count: parents.length, lists } });
    }

    /* ---- tạo lời chúc / trả lời ---- */
    if (route === '/api/comment' && method === 'POST') {
        if (!auth.guestAllowed(req, q, GUEST_KEY)) return send(401, { data: { message: 'Khoá truy cập không đúng' } });
        if (auth.rateLimited(ip, SERVER.rateLimitPerMinute)) {
            return send(429, { data: { message: 'Bạn gửi hơi nhanh, nghỉ một chút nhé' } });
        }
        const body = await readBody(req);
        const name = String(body.name || '').trim().slice(0, SERVER.maxNameLength);
        const comment = String(body.comment || '').trim().slice(0, SERVER.maxCommentLength);
        const gif = body.gif_id || body.gif_url || null;
        const parent = body.id || body.uuid || null;

        if (name.length < 2) return send(400, { data: { message: 'Tên phải có ít nhất 2 ký tự' } });
        if (!comment && !gif) return send(400, { data: { message: 'Lời chúc không được để trống' } });
        if (parent && !db().comments.some(c => c.uuid === parent)) {
            return send(400, { data: { message: 'Lời chúc cha không tồn tại' } });
        }
        if (parent && db().comments.some(c => c.parent_uuid === parent)) {
            return send(400, { data: { message: 'Chỉ trả lời được 1 cấp' } });
        }

        const row = {
            uuid: crypto.randomUUID(),
            name,
            presence: normalizePresence(body.presence),
            comment,
            gif_url: gif,
            parent_uuid: parent || null,
            ip_address: ip,
            user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
            is_admin: !!admin,
            created_at: new Date().toISOString(),
            updated_at: null
        };
        db().comments.push(row);
        save();
        console.log(`💬 ${parent ? 'Trả lời' : 'Lời chúc mới'} từ ${name} (${ip})`);
        return send(201, { code: 201, data: mapOne(row, ip, admin) });
    }

    /* ---- khu vực quản trị ---- */
    if (route === '/api/stats' && method === 'GET') {
        if (!admin) return send(401, { data: { message: 'Cần đăng nhập quản trị' } });
        return send(200, {
            code: 200,
            data: {
                comments: db().comments.length,
                likes: db().likes.length,
                present: db().comments.filter(c => c.presence === 1).length,
                absent: db().comments.filter(c => c.presence === 2).length
            }
        });
    }

    if (route === '/api/user') {
        if (!admin) return send(401, { data: { message: 'Cần đăng nhập quản trị' } });
        if (method === 'GET') {
            const { password, ...safe } = db().user;   // không bao giờ trả mật khẩu về client
            return send(200, { code: 200, data: safe });
        }
        if (method === 'PUT' || method === 'PATCH') {
            const body = await readBody(req);
            if (body.new_password) {
                if (!verifyPassword(body.old_password, db().user.password)) {
                    return send(400, { data: { status: false, message: 'Mật khẩu cũ không đúng' } });
                }
                if (String(body.new_password).length < 8) {
                    return send(400, { data: { status: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' } });
                }
                db().user.password = hashPassword(body.new_password);
                console.log('🔑 Đã đổi mật khẩu quản trị');
            }
            ['name', 'tenor_key'].forEach(k => { if (body[k] !== undefined) db().user[k] = body[k]; });
            save();
            return send(200, { code: 200, data: { status: true } });
        }
    }

    if (route === '/api/key' && method === 'POST') {
        if (!admin) return send(401, { data: { message: 'Cần đăng nhập quản trị' } });
        db().user.access_key = crypto.randomBytes(12).toString('hex');
        db().meta.access_key = crypto.randomBytes(16).toString('hex');
        save();
        return send(200, { code: 200, data: { status: true } });
    }

    if (route === '/api/download' && method === 'GET') {
        if (!admin) return send(401, { data: { message: 'Cần đăng nhập quản trị' } });
        const csv = toCsv();
        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="guestbook.csv"',
            'Content-Length': Buffer.byteLength(csv),
            'Access-Control-Allow-Origin': SERVER.corsOrigin
        });
        return res.end(csv);
    }

    /* ---- /api/comment/:id  (thích / bỏ thích / sửa / xoá) ---- */
    const m = route.match(/^\/api\/comment\/([a-zA-Z0-9-]+)$/);
    if (m) {
        const id = m[1];

        if (method === 'POST') {                       // THÍCH
            if (!auth.guestAllowed(req, q, GUEST_KEY)) return send(401, { data: { message: 'Khoá truy cập không đúng' } });
            if (!db().comments.some(c => c.uuid === id)) return send(404, { data: { message: 'Không thấy lời chúc' } });
            const existing = db().likes.find(l => l.comment_uuid === id && l.ip_address === ip);
            if (existing) return send(200, { code: 200, data: { uuid: existing.id } });
            const like = { id: crypto.randomUUID(), comment_uuid: id, ip_address: ip, created_at: new Date().toISOString() };
            db().likes.push(like);
            save();
            return send(201, { code: 201, data: { uuid: like.id } });
        }

        if (method === 'PATCH') {                      // BỎ THÍCH (không body) hoặc sửa
            const raw = await readBody(req).catch(() => ({}));
            if (!raw || Object.keys(raw).length === 0) {
                const like = db().likes.find(l => l.id === id && l.ip_address === ip)
                    || db().likes.find(l => l.id === id);
                if (!like) return send(200, { code: 200, data: { status: true } });
                db().likes = db().likes.filter(l => l !== like);
                save();
                return send(200, { code: 200, data: { status: true } });
            }
            return updateComment(id, raw, admin, ip, res);
        }

        if (method === 'PUT') return updateComment(id, await readBody(req), admin, ip, res);

        if (method === 'DELETE') {                     // XOÁ (kèm các trả lời)
            const target = db().comments.find(c => c.uuid === id);
            if (!target) return send(200, { code: 200, data: { status: true } });
            if (!admin && target.ip_address !== ip) return send(403, { data: { message: 'Không có quyền xoá' } });
            const victims = [target.uuid, ...db().comments.filter(c => c.parent_uuid === target.uuid).map(c => c.uuid)];
            db().comments = db().comments.filter(c => !victims.includes(c.uuid));
            db().likes = db().likes.filter(l => !victims.includes(l.comment_uuid));
            save();
            console.log(`🗑️  Đã xoá ${victims.length} lời chúc`);
            return send(200, { code: 200, data: { status: true } });
        }
    }

    return send(404, { data: { message: 'Không có route ' + method + ' ' + route } });
}

module.exports = { handle };
