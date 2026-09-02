const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Mo phong dung trinh tu that cua trinh duyet:
// noi dung metadata.js duoc noi thang vao cho the <script src="./metadata.js">
// (dong bo, trong <head>, chay TRUOC <body>) — dung code that, DOM that.
const META = fs.readFileSync(path.resolve('public/metadata.js'), 'utf8');
async function run(file, transform) {
    const meta = transform ? transform(META) : META;
    const html = fs.readFileSync(path.resolve(file), 'utf8')
        .replace('<script src="./metadata.js"></script>', '<script>' + meta + '</script>');
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        url: 'http://localhost:8080/' + path.basename(file)
    });
    await new Promise(r => setTimeout(r, 30));
    return dom.window.document;
}
let fail = 0;
function chk(label, actual, expected) {
    const ok = String(actual) === String(expected);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${ok ? ` = ${actual}` : `\n       actual  : ${actual}\n       expected: ${expected}`}`);
}
function has(label, actual, needle) {
    const ok = String(actual).includes(needle);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${label} -> ${actual}`);
}

(async () => {
    /* ================= index.html ================= */
    const d = await run('public/index.html');
    const q = s => d.querySelector(s);
    const txt = s => (q(s) || {}).textContent;

    console.log('=== public/index.html : head ===');
    chk('document.title', d.title, 'Thiệp Mời Đám Cưới Lý Thừa Ân & [Người Thương]');
    chk('og:locale', q('meta[property="og:locale"]').content, 'vi_VN');
    chk('og:url', q('meta[property="og:url"]').content, 'https://d4m-dev.github.io/wedding-invitation/');
    chk('canonical', q('link[rel="canonical"]').getAttribute('href'), 'https://d4m-dev.github.io/wedding-invitation/');
    chk('favicon', q('link[rel="icon"]').getAttribute('href'), './assets/favicon.ico');
    chk('apple-touch-icon', q('link[rel="apple-touch-icon"]').getAttribute('href'), './assets/images/icon-192x192.png');
    chk('theme-color', q('meta[name="theme-color"]').content, '#000000');

    console.log('\n=== index.html : thu tu CSS (giong ban goc) ===');
    const css = [...d.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'));
    css.forEach((h, i) => console.log(`       [${i}] ${h}`));
    chk('so stylesheet', css.length, 5);
    has('[0] Josefin', css[0], 'Josefin+Sans');
    has('[1] Dancing', css[1], 'Dancing+Script');
    has('[2] bootstrap', css[2], 'bootstrap@5.3.7/dist/css');
    has('[3] fontawesome', css[3], 'fontawesome-free@6.7.2');
    chk('[4] guest.css (CUOI CUNG)', css[4], './css/guest.css');
    chk('so preload', d.querySelectorAll('link[rel="preload"]').length, 6);

    console.log('\n=== index.html : thu tu JS ===');
    // (metadata.js duoc noi inline trong harness nen khong tinh vao danh sach src)
    const all = [...d.querySelectorAll('script[src]')];
    const js = all.map(s => s.getAttribute('src'));
    js.forEach((h, i) => console.log(`       [${i}] ${h}${all[i].async === false ? '  (async=false)' : ''}`));
    chk('so script (mode=node)', js.length, 2);
    chk('[0] bootstrap', js[0], 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js');
    chk('[1] guest.js (cuoi cung)', js[1], './js/guest.js');
    chk('KHONG nap supabase-api.js', js.join(',').includes('supabase-api'), false);
    chk('KHONG nap api-adapter.js', js.join(',').includes('api-adapter'), false);
    chk('tat ca deu async=false (giu thu tu)', all.every(s => s.async === false), true);

    console.log('\n=== index.html : doi backend.mode sang "supabase" ===');
    const s2 = await run('public/index.html', m => m.replace('mode: "node"', 'mode: "supabase"'));
    const js2 = [...s2.querySelectorAll('script[src]')].map(x => x.getAttribute('src'));
    console.log('       scripts:', js2.join(', '));
    chk('so script (mode=supabase)', js2.length, 4);
    chk('co supabase-api.js', js2[1], './js/supabase/supabase-api.js');
    chk('co api-adapter.js', js2[2], './js/supabase/api-adapter.js');
    chk('guest.js van cuoi cung', js2[3], './js/guest.js');

    console.log('\n=== index.html : body data-* ===');
    chk('data-time', d.body.getAttribute('data-time'), '2026-12-22 07:30:00');
    chk('data-audio', d.body.getAttribute('data-audio'), './assets/music/weddingsongs_ido.mp3');
    chk('data-confetti', d.body.getAttribute('data-confetti'), 'true');
    chk('data-key', d.body.getAttribute('data-key'), 'public-guest');
    chk('data-url', d.body.getAttribute('data-url'), 'http://localhost:8080');
    has('data-supabase-url', d.body.getAttribute('data-supabase-url'), 'supabase.co/rest/v1');
    chk('data-supabase-key (do dai)', d.body.getAttribute('data-supabase-key').length, 208);

    console.log('\n=== index.html : noi dung ===');
    chk('ten chu re', txt('[data-config="wedding.groom.fullName"]'), 'Lý Thừa Ân');
    chk('cha chu re', txt('[data-config="wedding.groom.father"]'), 'LÝ VĂN MẾN');
    chk('me chu re', txt('[data-config="wedding.groom.mother"]'), 'LÊ THỊ GIANG');
    chk('ten co dau', txt('[data-config="wedding.bride.fullName"]'), '[Người Thương]');
    chk('cha co dau', txt('[data-config="wedding.bride.father"]'), '[Ông]');
    chk('me co dau', txt('[data-config="wedding.bride.mother"]'), '[Bà]');
    chk('heroNames x3', d.querySelectorAll('[data-config="wedding.heroNames"]').length, 3);
    chk('ngay x3', d.querySelectorAll('[data-config="wedding.date.display"]').length, 3);
    chk('ngay hien thi', txt('[data-config="wedding.date.display"]'), 'Thứ 3, 22/12/2026 (nhằm ngày 14 tháng 11 năm Bính Ngọ — Âm lịch)');
    chk('href maps', q('[data-config-href="venue.mapsUrl"]').getAttribute('href'), 'https://goo.gl/maps/vEimtSpjtxdDpUgM8');
    chk('ngan hang', txt('[data-config="gifts.bank.bankName"]'), 'Vietcombank');
    chk('copy so TK', q('[data-config-attr="data-copy:gifts.bank.number"]').getAttribute('data-copy'), '1017969359');
    chk('copy dia chi', q('[data-config-attr="data-copy:gifts.gift.address"]').getAttribute('data-copy'), '180A, ấp Đường Gỗ Vàm, xã Long Thạnh, tỉnh An Giang.');
    chk('slide desktop #3', q('[data-config-index="2"]').getAttribute('data-src'), './assets/images/cewe.webp');

    /* --- khong duoc phu thuoc host anh ben ngoai (picsum...) vi mot host chet
           se keo theo S.invalid() va co the lam trang khong hien ra --- */
    (function () {
        const m = d.defaultView.WEDDING_CONFIG.media;
        const paths = [m.bg, m.placeholder, m.icon, m.music, m.video,
            ...m.desktopSlides, ...m.storySlides, ...m.gallery];
        const external = paths.filter(u => !String(u).startsWith('./assets/'));
        chk('moi duong dan media deu cuc bo (khong picsum/CDN)', external.length, 0);
        const missing = paths.filter(u => !fs.existsSync(path.resolve('public', String(u).replace(/^\.\//, ''))));
        chk('moi file media deu ton tai tren dia', missing.length, 0);
    })();
    chk('href github', q('[data-config-href="footer.githubUrl"]').getAttribute('href'), 'https://github.com/d4m-dev');
    chk('muc loi chuc con ton tai', !!d.getElementById('comment'), true);

    /* ================= dashboard.html ================= */
    console.log('\n=== dashboard.html ===');
    const a = await run('public/dashboard.html');
    chk('title', a.title, 'Dashboard');
    chk('theme-color', a.querySelector('meta[name="theme-color"]').content, '#f8f9fa');
    const acss = [...a.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'));
    chk('css cuoi cung', acss[acss.length - 1], './css/admin.css');
    const ajs = [...a.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
    chk('script cuoi cung', ajs[ajs.length - 1], './js/admin.js');
    chk('body data-key', a.body.getAttribute('data-key'), 'public-guest');
    chk('href github', a.querySelector('[data-config-href="footer.githubUrl"]').getAttribute('href'), 'https://github.com/d4m-dev');

    /* ================= test-supabase.html ================= */
    console.log('\n=== test-supabase.html ===');
    const t = await run('public/test-supabase.html');
    chk('title', t.title, 'Kiểm tra kết nối Supabase');
    chk('khong nap CDN css', t.querySelectorAll('link[rel="stylesheet"]').length, 0);
    const rawTest = fs.readFileSync(path.resolve('public/test-supabase.html'), 'utf8');
    has('metadata.js duoc nap trong <head>', rawTest.includes('<script src="./metadata.js"></script>'), true);
    chk('khong con url/key hardcode', /supabase\.co|eyJhbGci/.test(rawTest), false);
    chk('mode=node -> khong tiem script ngoai', [...t.querySelectorAll('script[src]')].length, 0);
    console.log('       (jsdom khong tai script ngoai, nen window.supabaseAPI undefined o day — binh thuong)');

    /* ================= code that trong dist/guest.js ================= */
    console.log('\n=== dist/guest.js : chay dung doan code da va (calendar + dem nguoc) ===');
    const g = fs.readFileSync('public/js/guest.js', 'utf8');
    const start = g.indexOf('let _W = window.WEDDING_CONFIG,');
    const endMark = 'm.search = i.toString()';
    const end = g.indexOf(endMark) + endMark.length;
    const snippet = g.slice(start, end);
    console.log('       doan code trich tu bundle:\n' + snippet.split('\n').map(l => '         ' + l).join('\n'));
    const W = (await run('public/index.html')).defaultView.WEDDING_CONFIG;
    const fakeDocument = { body: { getAttribute: k => ({ 'data-time': W.wedding.date.datetime })[k] } };
    const calendarUrl = new Function('window', 'document', `return (() => { ${snippet}; return m.toString(); })()`)(
        { WEDDING_CONFIG: W }, fakeDocument);
    console.log('       URL Google Calendar sinh ra:\n         ' + calendarUrl);
    const p = new URL(calendarUrl);
    chk('calendar host', p.origin + p.pathname, 'https://calendar.google.com/calendar/render');
    chk('calendar text', p.searchParams.get('text'), 'Lễ thành hôn của Lý Thừa Ân & [Người Thương]');
    chk('calendar ctz (truoc day la "undefined")', p.searchParams.get('ctz'), 'Asia/Ho_Chi_Minh');
    chk('calendar location', p.searchParams.get('location'), '180A, ấp Đường Gỗ Vàm, xã Long Thạnh, tỉnh An Giang.');
    chk('calendar dates (gio dia phuong + ctz)', p.searchParams.get('dates'), '20261222T0730/20261222T1000');
    const cdExpr = g.match(/new Date\(document\.body\.getAttribute\("data-time"\)[^\n]*?\.getTime\(\)/)[0];
    console.log('       bieu thuc dem nguoc: ' + cdExpr);
    const target = new Function('window', 'document', `return ${cdExpr}`)({ WEDDING_CONFIG: W }, fakeDocument);
    chk('dem nguoc -> UTC', new Date(target).toISOString(), '2026-12-22T00:30:00.000Z');
    chk('dem nguoc -> gio VN', new Date(target).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), '07:30:00 22/12/2026');

    console.log(`\n>>> ${fail === 0 ? 'TAT CA PASS' : fail + ' MUC FAIL'}`);
    process.exitCode = fail === 0 ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
