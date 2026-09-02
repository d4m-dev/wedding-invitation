/* =============================================================================
 *  metadata.js — NGUỒN CẤU HÌNH DUY NHẤT CỦA THIỆP CƯỚI
 * =============================================================================
 *  Toàn bộ URL, tên, ngày giờ, tài khoản, hình ảnh... đều nằm ở FILE NÀY.
 *  Các file khác chỉ ĐỌC từ `window.WEDDING_CONFIG`, không còn giá trị hardcode:
 *      - index.html          (thiệp khách)
 *      - dashboard.html      (trang quản trị)
 *      - test-supabase.html  (trang kiểm tra kết nối)
 *      - api/supabase-api.js (kết nối Supabase)
 *      - api/api-adapter.js  (cầu nối API cũ -> Supabase)
 *      - dist/guest.js       (Google Calendar, AOS, confetti, Tenor GIF, tra IP)
 *      - dist/admin.js       (Tenor GIF, tra IP)
 *
 *  CÁCH SỬA:
 *      1. Chỉ cần sửa PHẦN 1 bên dưới rồi lưu file. Xong.
 *      2. Không cần đụng tới bất kỳ file nào khác.
 *
 *  TRONG HTML, chỗ nào cần điền giá trị thì được đánh dấu bằng thuộc tính:
 *      data-config="duong.dan.gia.tri"          -> điền text
 *      data-config-html="duong.dan"             -> điền HTML
 *      data-config-src="duong.dan"              -> điền data-src (hoặc src)
 *      data-config-href="duong.dan"             -> điền href
 *      data-config-attr="ten-thuoc-tinh:duong.dan" -> điền thuộc tính bất kỳ
 *
 *  PHẦN 2 (bộ máy bên dưới) là code tự động — KHÔNG cần sửa.
 * ===========================================================================*/

/* Trang nào đang chạy? Đặt TRƯỚC khi nạp file này:
 *   index.html          -> window.WEDDING_PAGE = "guest"
 *   dashboard.html      -> window.WEDDING_PAGE = "admin"
 *   test-supabase.html  -> window.WEDDING_PAGE = "test"                      */
window.WEDDING_PAGE = window.WEDDING_PAGE || "guest";

/* ========================== PHẦN 1 — CẤU HÌNH ============================== */
window.WEDDING_CONFIG = {

    /* ---------------------------------------------------------------------
     * 1. BACKEND — SUPABASE (lời chúc / guestbook)
     *    Lấy URL + key tại: Supabase Dashboard > Settings > API
     * ------------------------------------------------------------------- */
    backend: {
        // ── CHỌN BACKEND ────────────────────────────────────────────────
        //   "node"     -> server.js trong repo (KHÔNG cần npm install, chạy
        //                  được trên Termux/điện thoại). Khuyến nghị.
        //   "supabase" -> backend cũ trên mây (cần api/supabase-api.js +
        //                  api/api-adapter.js, tự động được nạp kèm).
        mode: "node",

        // Nơi trình duyệt gọi API. Để "" = cùng origin (server.js vừa phát web
        // vừa phát API). Nếu web đặt ở GitHub Pages còn API chạy trên điện
        // thoại thì điền: "http://192.168.1.20:8080"
        apiBase: "",

        // URL phải kết thúc bằng /rest/v1 (chỉ dùng khi mode = "supabase")
        supabaseUrl: "https://adnooupemxlhgydtvoeo.supabase.co/rest/v1",

        // Khoá anon/public (bắt đầu bằng eyJ...)
        supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbm9vdXBlbXhsaGd5ZHR2b2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI4NTgsImV4cCI6MjA4NDMyODg1OH0.O5GUKGW3TVDGbcVvFUJZ08F_BbG9fhf5VlgIyBApjLU",

        // dist/guest.js chỉ hiện mục "Lời chúc" khi body[data-key] khác rỗng.
        // (Backend Supabase không cần khoá này, nó chỉ là công tắc bật/tắt.)
        guestKey: "public-guest",

        // Đặt false để ẨN HẲN mục lời chúc mà không cần sửa HTML
        enableGuestbook: true,

        // Tên bảng trong Supabase (xem SUPABASE_SETUP.md)
        tables: { comments: "comments", likes: "likes" },

        // Dịch vụ phụ trợ
        ipLookupUrl: "https://api.ipify.org?format=json",   // lấy IP khách
        geoLookupUrl: "https://apip.cc/api-json/{ip}",      // tra vị trí từ IP ({ip} sẽ được thay)
        docsUrl: "https://supabase.com"                     // link hướng dẫn hiện khi chưa cấu hình
    },

    /* ---------------------------------------------------------------------
     * 1b. MÁY CHỦ NODE.JS (server.js) — chạy được trên Termux
     *     LƯU Ý: KHÔNG để mật khẩu ở file này, vì metadata.js được phát công
     *     khai cho trình duyệt. Tài khoản quản trị nằm trong ./data/db.json
     *     và được in ra màn hình ở lần chạy đầu tiên.
     * ------------------------------------------------------------------- */
    server: {
        host: "0.0.0.0",              // 0.0.0.0 = cho máy khác trong WiFi truy cập
        port: 8080,                   // đổi ở đây, hoặc: node server.js --port 3000
        dataDir: "./data",            // nơi lưu db.json (nhớ sao lưu file này)
        publicDir: ".",               // thư mục phát web
        perPage: 10,                  // số lời chúc mỗi trang
        maxCommentLength: 1000,
        maxNameLength: 50,
        corsOrigin: "*",              // siết lại thành domain của bạn nếu muốn
        rateLimitPerMinute: 30        // chống spam theo IP
    },

    /* ---------------------------------------------------------------------
     * 2. THƯ VIỆN TỪ CDN  (đổi phiên bản Bootstrap / FontAwesome ở đây)
     * ------------------------------------------------------------------- */
    cdn: {
        dnsPrefetch: [
            "https://cdn.jsdelivr.net",
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com"
        ],
        preconnect: [
            { href: "https://cdn.jsdelivr.net", crossorigin: true },
            { href: "https://fonts.googleapis.com", crossorigin: true },
            { href: "https://fonts.gstatic.com", crossorigin: true }
        ],
        // Chỉ tải trước (preload) — giữ nguyên như bản gốc
        preload: [
            { href: "https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap", as: "style" },
            { href: "https://fonts.googleapis.com/css2?family=Sacramento&display=swap", as: "style" },
            { href: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic&display=swap", as: "style" },
            {
                href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css", as: "style",
                integrity: "sha256-zRgmWB5PK4CvTx4FiXsxbHaYRBBjz/rvu97sOC7kzXI=", crossorigin: "anonymous"
            },
            {
                href: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css", as: "style",
                integrity: "sha256-dABdfBfUoC8vJUBOwGVdm8L9qlMWaHTIfXt+7GnZCIo=", crossorigin: "anonymous"
            },
            {
                href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js", as: "script",
                integrity: "sha256-NfRUfZNkERrKSFA0c1a8VmCplPDYtpTYj5lQmKe1R/o=", crossorigin: "anonymous"
            }
        ],
        // CSS — nạp theo đúng thứ tự trong mảng
        stylesheets: [
            { href: "https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap" },
            { href: "https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap" },
            {
                href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
                integrity: "sha256-zRgmWB5PK4CvTx4FiXsxbHaYRBBjz/rvu97sOC7kzXI=",
                crossorigin: "anonymous"
            },
            {
                href: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css",
                integrity: "sha256-dABdfBfUoC8vJUBOwGVdm8L9qlMWaHTIfXt+7GnZCIo=",
                crossorigin: "anonymous"
            }
        ],
        // CSS cục bộ của dự án (không phải CDN)
        localStylesheets: {
            guest: "./css/guest.css",
            admin: "./css/admin.css"
        },
        // JS — nạp TUẦN TỰ theo đúng thứ tự trong mảng
        scripts: {
            guest: [
                {
                    src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js",
                    integrity: "sha256-NfRUfZNkERrKSFA0c1a8VmCplPDYtpTYj5lQmKe1R/o=",
                    crossorigin: "anonymous"
                },
                { src: "./js/supabase/supabase-api.js", backends: ["supabase"] },
                { src: "./js/supabase/api-adapter.js", backends: ["supabase"] },
                { src: "./js/guest.js" }
            ],
            admin: [
                {
                    src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js",
                    integrity: "sha256-NfRUfZNkERrKSFA0c1a8VmCplPDYtpTYj5lQmKe1R/o=",
                    crossorigin: "anonymous"
                },
                { src: "./js/supabase/supabase-api.js", backends: ["supabase"] },
                { src: "./js/supabase/api-adapter.js", backends: ["supabase"] },
                { src: "./js/admin.js" }
            ],
            test: [
                { src: "./js/supabase/supabase-api.js", backends: ["supabase"] }
            ]
        },
        // Thư viện do dist/guest.js tự nạp khi cần (hiệu ứng cuộn + pháo giấy)
        runtime: {
            aosCss: "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css",
            aosJs: "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js",
            confettiJs: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js"
        }
    },

    /* ---------------------------------------------------------------------
     * 3. SEO / TAB TRÌNH DUYỆT / ICON
     * ------------------------------------------------------------------- */
    site: {
        url: "https://d4m-dev.github.io/wedding-invitation/",
        title: "Thiệp Mời Đám Cưới Lý Thừa Ân & [Người Thương]",
        metaTitle: "Online wedding invitation website of Ân and [Người Thương]",
        description: "Online wedding invitation website of Ân and [Người Thương]",
        keywords: "wedding, wedding digital, card online, wedding invitation, template cacar, wedding invitation github, template website",
        author: "dewanakl",
        language: "vi",
        robots: "index, follow, max-image-preview:large",
        image: "./assets/images/bg.webp",
        imageType: "image/webp",
        imageWidth: "980",
        imageHeight: "980",
        locale: "vi_VN",
        type: "website",
        siteName: "Online wedding invitation website of Ân and [Người Thương]",
        appName: "Online wedding invitation website of Ân and [Người Thương]",
        favicon: "./assets/favicon.ico",
        appleIcon: "./assets/images/icon-192x192.png",
        themeColor: "#000000",
        colorScheme: "dark light",
        appleStatusBar: "black-translucent",
        mobileWebAppCapable: "yes"
    },

    /* ---------------------------------------------------------------------
     * 3b. RIÊNG CHO TỪNG TRANG (ghi đè mục `site` ở trên)
     *     dashboard.html và test-supabase.html dùng tiêu đề/ màu nền riêng
     * ------------------------------------------------------------------- */
    pages: {
        guest: {},
        admin: {
            title: "Dashboard",
            metaTitle: "Dashboard",
            description: "Dashboard",
            appName: "Dashboard",
            themeColor: "#f8f9fa"
        },
        test: {
            title: "Kiểm tra kết nối Supabase",
            metaTitle: "Kiểm tra kết nối Supabase",
            description: "Trang kiểm tra cấu hình backend Supabase của thiệp cưới",
            appName: "Kiểm tra Supabase",
            themeColor: "#f8f9fa",
            // Trang tiện ích: dùng CSS inline riêng, không nạp Bootstrap/FontAwesome
            stylesheets: [],
            localStylesheets: null
        }
    },

    /* ---------------------------------------------------------------------
     * 4. CÔ DÂU — CHÚ RỂ
     * ------------------------------------------------------------------- */
    wedding: {
        groom: {
            fullName: "Lý Thừa Ân",
            shortName: "Thừa Ân",
            order: "Út Nam",              // thứ trong gia đình
            parentsTitle: "Ông Bà",
            father: "LÝ VĂN MẾN",
            mother: "LÊ THỊ GIANG",
            photo: "./assets/images/cowo.webp"
        },
        bride: {
            fullName: "[Người Thương]",    // <-- ĐIỀN TÊN CÔ DÂU
            shortName: "[Người Thương]",   // <-- tên ngắn (hiện ở hero)
            order: "Thứ []",               // <-- thứ trong gia đình
            parentsTitle: "ÔNG BÀ",
            father: "[Ông]",               // <-- ĐIỀN TÊN CHA
            mother: "[Bà]",                // <-- ĐIỀN TÊN MẸ
            photo: "./assets/images/cewe.webp"
        },
        heroTitle: "Thiệp Mời Đám Cưới",
        heroNames: "Thừa Ân & [Người Thương]",
        welcomeTitle: "The Wedding Of",
        sectionHeading: "Chúc Mừng Lễ Thành Hôn",
        guestGreeting: "Trân trọng gửi đến quý Ông/Bà/Anh/Chị",

        timezone: {
            offset: "+07:00",              // múi giờ Việt Nam
            name: "Asia/Ho_Chi_Minh"
        },
        date: {
            // Chuỗi này quyết định đồng hồ đếm ngược (body[data-time])
            datetime: "2026-12-22 07:30:00",
            // Dòng ngày giờ hiện trên thiệp
            display: "Thứ 3, 22/12/2026 (nhằm ngày 14 tháng 11 năm Bính Ngọ — Âm lịch)"
        }
    },

    /* ---------------------------------------------------------------------
     * 5. CHƯƠNG TRÌNH NGÀY CƯỚI
     * ------------------------------------------------------------------- */
    events: {
        ceremony: { label: "Lễ Cưới", time: "07:30 Giờ sáng", note: "Đến khi hoàn tất" },
        reception: { label: "Đãi Tiệc", time: "09:00 Giờ sáng", note: "Đến khi kết thúc" }
    },

    /* ---------------------------------------------------------------------
     * 6. ĐỊA ĐIỂM
     * ------------------------------------------------------------------- */
    venue: {
        address: "180A, ấp Đường Gỗ Vàm, xã Long Thạnh, tỉnh An Giang.",
        mapsUrl: "https://goo.gl/maps/vEimtSpjtxdDpUgM8",
        mapsLabel: "Mở Google Maps"
    },

    /* ---------------------------------------------------------------------
     * 7. NÚT "LƯU VÀO GOOGLE CALENDAR"
     * ------------------------------------------------------------------- */
    calendar: {
        endpoint: "https://calendar.google.com/calendar/render",
        title: "Lễ thành hôn của Lý Thừa Ân & [Người Thương]",
        details: "Với tất cả lòng trân trọng, chúng tôi trân trọng kính mời quý vị đến dự lễ thành hôn của chúng tôi. Xin chân thành cảm ơn sự quan tâm và những lời chúc phúc của quý vị - đó là niềm hạnh phúc và vinh dự lớn lao đối với chúng tôi.",
        start: "2026-12-22 07:30",
        end: "2026-12-22 10:00",
        buttonLabel: "Lưu vào Google Calendar"
    },

    /* ---------------------------------------------------------------------
     * 8. QUÀ CƯỚI (chuyển khoản / QR / quà tặng)
     * ------------------------------------------------------------------- */
    gifts: {
        bank: {
            holder: "LY THUA AN",          // tên chủ tài khoản (không dấu)
            bankName: "Vietcombank",
            number: "1017969359"
        },
        qr: {
            holder: "LY THUA AN",
            image: "./assets/images/donate.jpg"
        },
        gift: {
            holder: "LY THUA AN",
            phone: "0812135854",
            address: "180A, ấp Đường Gỗ Vàm, xã Long Thạnh, tỉnh An Giang."
        }
    },

    /* ---------------------------------------------------------------------
     * 9. HÌNH ẢNH / NHẠC / VIDEO
     * ------------------------------------------------------------------- */
    media: {
        placeholder: "./assets/images/placeholder.webp",
        bg: "./assets/images/bg.webp",
        icon: "./assets/images/icon-192x192.png",
        music: "./assets/music/weddingsongs_ido.mp3",
        video: "./assets/video/265501_tiny.mp4",
        // Ảnh nền chế độ desktop (3 ảnh chạy slideshow)
        desktopSlides: [
            "./assets/images/banner.webp",
            "./assets/images/cowo.webp",
            "./assets/images/cewe.webp"
        ],
        // Ảnh trong mục "Khoảnh Khắc"
        gallery: [
            "./assets/images/img-1.jpg",
            "./assets/images/img-2.jpg",
            "./assets/images/img-3.jpg"
        ],
        // Ảnh trong mục "Câu Chuyện Tình Yêu"
        storySlides: [
            "./assets/images/img-1.jpg",
            "./assets/images/img-2.jpg",
            "./assets/images/img-3.jpg"
        ]
    },

    /* ---------------------------------------------------------------------
     * 10. CHÂN TRANG
     * ------------------------------------------------------------------- */
    footer: {
        credit: "d4m-dev",
        githubUrl: "https://github.com/d4m-dev",
        musicUrl: "https://d4m-dev.github.io/appmusic/"
    },

    /* ---------------------------------------------------------------------
     * 11. GIAO DIỆN
     * ------------------------------------------------------------------- */
    ui: {
        confetti: true,          // pháo giấy khi khách mở thiệp
        theme: "auto"            // "auto" | "dark" | "light"
    },

    /* ---------------------------------------------------------------------
     * 12. DỊCH VỤ BÊN THỨ 3
     * ------------------------------------------------------------------- */
    thirdParty: {
        // Tìm GIF (Tenor). apiKey để null = tắt nút GIF.
        // Lấy key miễn phí: https://developers.google.com/tenor/guides/quickstart
        gif: {
            endpoint: "https://tenor.googleapis.com/v2",
            clientKey: "undangan_app",
            apiKey: null,
            mediaFilter: "tinygif"
        }
    }
};

/* ==================== PHẦN 2 — BỘ MÁY (không cần sửa) ====================== */
(function () {
    "use strict";

    var C = window.WEDDING_CONFIG;
    var page = window.WEDDING_PAGE;

    /* ---- đọc giá trị theo đường dẫn "a.b.c" ---- */
    function get(path, fallback) {
        var value = String(path).split(".").reduce(function (acc, key) {
            return (acc === null || acc === undefined) ? acc : acc[key];
        }, C);
        return (value === null || value === undefined) ? fallback : value;
    }
    window.weddingGet = get;

    /* server.js (Node) cũng đọc file này để lấy cấu hình — khi đó không có DOM,
     * nên chỉ cần xuất WEDDING_CONFIG rồi dừng, không chạy phần áp dụng.      */
    if (typeof document === "undefined") { return; }

    function el(tag, attrs) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            if (attrs[key] !== undefined && attrs[key] !== null && attrs[key] !== false) {
                node.setAttribute(key, attrs[key] === true ? "" : attrs[key]);
            }
        });
        return node;
    }

    function setMeta(selector, attr, value) {
        var node = document.head.querySelector(selector);
        if (!node) { return; }
        if (value !== undefined && value !== null) { node.setAttribute(attr, value); }
    }

    /* =====================================================================
     * A. PHẦN <head> — chạy NGAY khi file này được nạp (chưa parse <body>)
     * =================================================================== */
    function applyHead() {
        // Dat theme som; guest.js se tu phan giai "auto" -> light/dark ngay sau do.
        // KHONG gan lai trong applyBody ( chay sau) vi se ghi de ket qua phan giai.
        document.documentElement.setAttribute("data-bs-theme", C.ui.theme);
        // gộp cấu hình chung (site) với cấu hình riêng của trang hiện tại
        var s = {};
        Object.keys(C.site).forEach(function (k) { s[k] = C.site[k]; });
        var override = C.pages[page] || {};
        Object.keys(override).forEach(function (k) { s[k] = override[k]; });

        /* --- tiêu đề + thẻ meta --- */
        document.title = s.title;
        setMeta('meta[name="author"]', "content", s.author);
        setMeta('meta[name="language"]', "content", s.language);
        setMeta('meta[name="robots"]', "content", s.robots);
        setMeta('meta[name="googlebot"]', "content", s.robots);
        setMeta('meta[name="title"]', "content", s.metaTitle);
        setMeta('meta[name="description"]', "content", s.description);
        setMeta('meta[name="keywords"]', "content", s.keywords);
        setMeta('meta[property="og:title"]', "content", s.metaTitle);
        setMeta('meta[property="og:description"]', "content", s.description);
        setMeta('meta[property="og:keywords"]', "content", s.keywords);
        setMeta('meta[property="og:image"]', "content", s.image);
        setMeta('meta[property="og:image:secure_url"]', "content", s.image);
        setMeta('meta[property="og:image:type"]', "content", s.imageType);
        setMeta('meta[property="og:image:alt"]', "content", s.metaTitle);
        setMeta('meta[property="og:image:width"]', "content", s.imageWidth);
        setMeta('meta[property="og:image:height"]', "content", s.imageHeight);
        setMeta('meta[property="og:type"]', "content", s.type);
        setMeta('meta[property="og:locale"]', "content", s.locale);
        setMeta('meta[property="og:url"]', "content", s.url);
        setMeta('meta[property="og:site_name"]', "content", s.siteName);
        setMeta('meta[name="mobile-web-app-capable"]', "content", s.mobileWebAppCapable);
        setMeta('meta[name="apple-mobile-web-app-title"]', "content", s.appName);
        setMeta('meta[name="theme-color"]', "content", s.themeColor);
        setMeta('meta[name="color-scheme"]', "content", s.colorScheme);
        setMeta('meta[name="apple-mobile-web-app-status-bar-style"]', "content", s.appleStatusBar);
        setMeta('link[rel="canonical"]', "href", s.url);
        setMeta('link[rel="shortcut icon"]', "href", s.favicon);
        setMeta('link[rel="icon"]', "href", s.favicon);
        setMeta('link[rel="apple-touch-icon"]', "href", s.appleIcon);

        /* --- dns-prefetch / preconnect / preload --- */
        C.cdn.dnsPrefetch.forEach(function (href) {
            document.head.appendChild(el("link", { rel: "dns-prefetch", href: href }));
        });
        C.cdn.preconnect.forEach(function (item) {
            document.head.appendChild(el("link", { rel: "preconnect", href: item.href, crossorigin: item.crossorigin }));
        });
        C.cdn.preload.forEach(function (item) {
            document.head.appendChild(el("link", {
                rel: "preload", href: item.href, as: item.as,
                integrity: item.integrity, crossorigin: item.crossorigin
            }));
        });

        /* --- CSS: CDN trước, CSS cục bộ SAU CÙNG (giữ đúng thứ tự cascade
               như bản gốc: guest.css/admin.css phải đứng cuối để ghi đè Bootstrap) --- */
        var cssList = (override.stylesheets !== undefined) ? override.stylesheets : C.cdn.stylesheets;
        cssList.forEach(function (item) {
            document.head.appendChild(el("link", {
                rel: "stylesheet",
                href: item.href,
                integrity: item.integrity,
                crossorigin: item.crossorigin
            }));
        });
        var localCss = (override.localStylesheets !== undefined)
            ? override.localStylesheets
            : (C.cdn.localStylesheets[page] || null);
        if (localCss) {
            document.head.appendChild(el("link", { rel: "stylesheet", href: localCss }));
        }

        /* --- JS: nạp tuần tự, giữ đúng thứ tự (async = false) --- */
        var jsList = ((override.scripts !== undefined) ? override.scripts : (C.cdn.scripts[page] || []))
            // script nào chỉ dành cho backend khác thì bỏ qua
            .filter(function (item) {
                return !item.backends || item.backends.indexOf(C.backend.mode) !== -1;
            });
        jsList.forEach(function (item) {
            var script = el("script", {
                src: item.src,
                integrity: item.integrity,
                crossorigin: item.crossorigin
            });
            script.async = false;   // bắt buộc: giữ thứ tự thực thi
            document.head.appendChild(script);
        });
    }

    /* =====================================================================
     * B. PHẦN <body> — chạy khi DOM sẵn sàng
     *    (đăng ký TRƯỚC dist/guest.js nên luôn chạy trước nó)
     * =================================================================== */
    function applyBody() {
        var body = document.body;
        if (!body) { return; }

        /* --- 1. thuộc tính cấu hình trên <body> mà dist/*.js đọc --- */
        var be = C.backend;
        body.setAttribute("data-supabase-url", be.supabaseUrl);
        body.setAttribute("data-supabase-key", be.supabaseAnonKey);
        // API base: để trống trong cấu hình = dùng chính origin đang mở trang
        body.setAttribute("data-url", C.backend.apiBase || window.location.origin);
        body.setAttribute("data-key", be.enableGuestbook ? be.guestKey : "");
        body.setAttribute("data-audio", C.media.music);
        body.setAttribute("data-confetti", String(!!C.ui.confetti));
        body.setAttribute("data-time", C.wedding.date.datetime);

        /* --- 2. điền giá trị vào các thẻ có data-config* --- */
        document.querySelectorAll("[data-config]").forEach(function (node) {
            node.textContent = get(node.getAttribute("data-config"), "");
        });
        document.querySelectorAll("[data-config-html]").forEach(function (node) {
            node.innerHTML = get(node.getAttribute("data-config-html"), "");
        });
        document.querySelectorAll("[data-config-src]").forEach(function (node) {
            var value = get(node.getAttribute("data-config-src"), "");
            // dist/guest.js tự đổi data-src -> src (lazy load)
            if (node.hasAttribute("data-src")) { node.setAttribute("data-src", value); }
            else { node.setAttribute("src", value); }
        });
        document.querySelectorAll("[data-config-href]").forEach(function (node) {
            node.setAttribute("href", get(node.getAttribute("data-config-href"), "#"));
        });
        document.querySelectorAll("[data-config-attr]").forEach(function (node) {
            node.getAttribute("data-config-attr").split(",").forEach(function (pair) {
                var parts = pair.split(":");
                if (parts.length === 2) {
                    node.setAttribute(parts[0].trim(), get(parts[1].trim(), ""));
                }
            });
        });

        /* --- 3. ảnh nền slideshow desktop + ảnh story (nhiều thẻ giống nhau) --- */
        document.querySelectorAll("[data-config-list]").forEach(function (node) {
            var list = get(node.getAttribute("data-config-list"), []);
            var index = parseInt(node.getAttribute("data-config-index"), 10) || 0;
            if (Array.isArray(list) && list[index]) {
                if (node.hasAttribute("data-src")) { node.setAttribute("data-src", list[index]); }
                else { node.setAttribute("src", list[index]); }
            }
        });

        /* --- 4. ẩn mục lời chúc nếu tắt trong cấu hình --- */
        if (!C.backend.enableGuestbook) {
            var comment = document.getElementById("comment");
            if (comment) { comment.remove(); }
            var navComment = document.querySelector('a.nav-link[href="#comment"]');
            if (navComment && navComment.closest("li.nav-item")) { navComment.closest("li.nav-item").remove(); }
        }
    }

    /* --- chạy --- */
    applyHead();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyBody);
    } else {
        applyBody();
    }
})();
