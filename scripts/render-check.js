/*
 * render-check.js — mở public/index.html trong jsdom, nạp metadata.js + guest.js
 * thật, gọi API thật tới server đang chạy, rồi khẳng định trang CÓ hiện ra.
 *
 * Vì sao cần: <div id="root"> mang class "opacity-0" và chỉ được bỏ đi khi sự kiện
 * "undangan.progress.done" bắn. Trước đây chỉ cần MỘT tài nguyên lỗi (CDN, ảnh
 * ngoài) là S.invalid() đóng băng bộ đếm -> done không bao giờ bắn -> trang trắng.
 *
 *   MODE=BLOCKED node scripts/render-check.js   # CDN + host ngoài chết hết (mặc định)
 *   MODE=OK      node scripts/render-check.js   # mọi thứ tải được
 *
 * Yêu cầu: npm install jsdom --no-save ; server đang chạy ở cổng 8080.
 * MODE=OK cần thêm: npm install aos canvas-confetti (để giả lập CDN hoạt động).
 */
const fs = require('fs');
const path = require('path');

let JSDOM, VirtualConsole;
try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch {
    console.log('SKIP | jsdom chưa cài (npm install jsdom --no-save)');
    process.exit(0);
}

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const MODE = process.env.MODE || 'BLOCKED';
const WAIT = Number(process.env.WAIT || 25000);

function findModule(name) {
    for (const base of [ROOT, '/tmp/sricheck']) {
        const p = path.join(base, 'node_modules', name);
        if (fs.existsSync(p)) return p;
    }
    return null;
}

const LOCAL = {};
const aos = findModule('aos');
const conf = findModule('canvas-confetti');
if (aos && conf) {
    LOCAL['https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css'] = [path.join(aos, 'dist/aos.css'), 'text/css'];
    LOCAL['https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js'] = [path.join(aos, 'dist/aos.js'), 'text/javascript'];
    LOCAL['https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js'] =
        [path.join(conf, 'dist/confetti.browser.js'), 'text/javascript'];
}

let html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
// nạp metadata.js và guest.js inline theo đúng thứ tự thực thi của trình duyệt
html = html.replace('<script src="./metadata.js"></script>',
    '<script>' + fs.readFileSync(path.join(PUB, 'metadata.js'), 'utf8') + '</script>');
html = html.replace('</body>',
    '<script>' + fs.readFileSync(path.join(PUB, 'js/guest.js'), 'utf8') + '</script></body>');

const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e.message || e).slice(0, 160)));
vc.on('error', (...a) => errs.push(a.join(' ').slice(0, 160)));

function prep(w) {
    // --- các API jsdom còn thiếu (trình duyệt thật đều có) ---
    w.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent() { return false } });
    w.IntersectionObserver = class {
        constructor(cb) { this.cb = cb }
        observe(el) { this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1, boundingClientRect: el.getBoundingClientRect(), intersectionRect: el.getBoundingClientRect(), rootBounds: null, time: 0 }], this) }
        unobserve() {} disconnect() {}
    };
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.scrollTo = () => {}; w.open = () => null;
    w.structuredClone = structuredClone;
    w.Headers = Headers; w.Response = Response; w.Request = Request; w.Blob = Blob;
    w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
    w.AOS = { init() {}, refresh() {}, refreshHard() {} };
    w.confetti = () => Promise.resolve();
    w.bootstrap = { Modal: class { constructor() {} static getOrCreateInstance() { return new w.bootstrap.Modal() } show() {} hide() {} } };

    // --- mô phỏng trình duyệt: <img> tải xong thì bắn sự kiện load ---
    const desc = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
    if (desc) {
        Object.defineProperty(w.HTMLImageElement.prototype, 'src', {
            configurable: true,
            get() { return desc.get.call(this) },
            set(v) {
                desc.set.call(this, v);
                const s = this;
                setTimeout(() => {
                    Object.defineProperty(s, 'naturalWidth', { value: 800, configurable: true });
                    Object.defineProperty(s, 'naturalHeight', { value: 600, configurable: true });
                    Object.defineProperty(s, 'complete', { value: true, configurable: true });
                    s.dispatchEvent(new w.Event('load'));
                }, 0);
            }
        });
    }
    // jsdom không nạp <link>/<script> con: tự bắn load để luồng tải đi tiếp
    new w.MutationObserver(list => {
        for (const m of list) for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const t = n.tagName;
            if ((t === 'LINK' && n.getAttribute('href')) || (t === 'SCRIPT' && n.getAttribute('src'))) {
                setTimeout(() => { try { n.dispatchEvent(new w.Event('load')) } catch {} }, 0);
            }
        }
    }).observe(w.document, { childList: true, subtree: true });

    // --- fetch: tài nguyên cục bộ -> server thật; CDN -> tuỳ MODE ---
    const real = fetch;
    w.fetch = (u, o) => {
        const raw = (typeof u === 'string') ? u : (u && u.url) ? u.url : String(u);
        const url = new URL(raw, BASE).href;
        if (LOCAL[url]) {
            if (MODE === 'BLOCKED') return Promise.reject(new TypeError('network blocked'));
            const [f, ct] = LOCAL[url];
            return Promise.resolve(new Response(fs.readFileSync(f), { status: 200, headers: { 'Content-Type': ct } }));
        }
        if (!url.startsWith(BASE)) {
            return MODE === 'BLOCKED'
                ? Promise.reject(new TypeError('network blocked'))
                : Promise.resolve(new Response('', { status: 200 }));
        }
        return real(url, o);
    };
}

const dom = new JSDOM(html, {
    url: BASE + '/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc, beforeParse: prep
});
const w = dom.window;
let done = false, skipped = 0;
w.document.addEventListener('undangan.progress.done', () => { done = true });
w.document.addEventListener('undangan.progress.invalid', () => { skipped++ });

setTimeout(() => {
    const root = w.document.getElementById('root');
    const cls = root ? root.className : '(không có #root)';
    const visible = root ? !/opacity-0/.test(root.className) : false;
    let fail = 0;
    const chk = (name, got, want) => {
        const ok = got === want;
        if (!ok) fail++;
        console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} = ${JSON.stringify(got)}`);
    };
    console.log(`\n=== render-check (MODE=${MODE}) ===`);
    chk('#root không còn opacity-0 (trang hiện ra)', visible, true);
    chk('progress.done đã bắn', done, true);
    console.log(`       số mục lỗi được bỏ qua: ${skipped}`);
    if (errs.length) console.log('       lỗi jsdom (không phải lỗi app): ' + errs.slice(0, 3).join(' | '));
    console.log(fail === 0 ? '>>> PASS' : `>>> FAIL: ${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}, WAIT);
