# Wedding Invitation Website 💒💍

Thiệp cưới số có sổ lời chúc, chạy bằng **Node.js thuần** — không cần `npm install`,
chạy được trên điện thoại Android qua Termux.

**Live Demo**: https://d4m-dev.github.io/wedding-invitation/

## ✨ Features

- 📱 Responsive design (Mobile & Desktop)
- 💬 Guestbook with comments and replies
- ❤️ Like system
- 🖼️ GIF support in comments
- ⏰ Countdown timer
- 🎵 Background music
- 🎊 Confetti animation
- 🗺️ Google Maps integration
- 🔧 **1 file cấu hình duy nhất**: `public/metadata.js`
- 📦 **Backend Node.js zero-dependency**: `server.js` (chạy trên Termux được)
- ☁️ Vẫn giữ được backend Supabase nếu muốn (đổi 1 dòng)

## 🚀 Quick Setup

### Cách 1 — Backend Node.js (khuyên dùng, chạy trên điện thoại được)

```bash
node server.js
```

Xong. Mở http://127.0.0.1:8080

- Không cần `npm install` — `server.js` chỉ dùng module có sẵn của Node (cần Node ≥ 18)
- Dữ liệu lưu ở `data/db.json` (1 file duy nhất, dễ sao lưu)
- Tài khoản quản trị được tạo ở lần chạy đầu và in ra màn hình
- Muốn chạy trên điện thoại: xem **[docs/TERMUX.md](docs/TERMUX.md)**

### Cách 2 — Backend Supabase (không cần chạy server)

1. Làm theo **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**
2. Trong `public/metadata.js`, đổi:

```js
backend: {
    mode: "supabase",                                   // thay vì "node"
    supabaseUrl: "https://YOUR-PROJECT.supabase.co/rest/v1",
    supabaseAnonKey: "eyJ...",
}
```

Trang web sẽ tự nạp `public/js/supabase/supabase-api.js` + `api-adapter.js`. Không phải sửa file nào khác.

### Cách 3 — Deploy lên GitHub Pages (chỉ phần tĩnh)

GitHub Pages chỉ phát file tĩnh, nên phần lời chúc cần backend Supabase (Cách 2)
hoặc trỏ `backend.apiBase` về server Node đang chạy ở nhà:

```js
backend: {
    mode: "node",
    apiBase: "http://192.168.1.20:8080",   // server.js trên điện thoại/máy nhà
}
```

### 3. Deploy

```bash
git add .
git commit -m "Configure Supabase backend"
git push
```

GitHub Pages will auto-deploy in ~2 minutes!

## 📁 Project Structure

```
wedding-invitation/
├── server.js               # ⭐ ĐIỂM KHỞI ĐỘNG — node server.js
├── package.json            # npm start / npm test (không có dependency)
├── README.md
├── .env.example            # ghi chú cấu hình (tài liệu, không bắt buộc)
│
├── public/                 # 🌐 WEB ROOT — chỉ thư mục này được phát ra ngoài
│   ├── metadata.js         # ⭐ FILE CẤU HÌNH DUY NHẤT — sửa ở đây!
│   ├── index.html          # thiệp khách (chỉ là khung, giá trị do metadata.js điền)
│   ├── dashboard.html      # trang quản trị
│   ├── test-supabase.html  # trang kiểm tra kết nối (chỉ dùng khi mode=supabase)
│   ├── assets/
│   │   ├── images/         # ảnh nền, ảnh cô dâu chú rể, gallery, QR
│   │   ├── music/          # nhạc nền
│   │   └── video/          # video câu chuyện tình yêu
│   ├── css/
│   │   ├── guest.css       # theme thiệp khách (import common + animation)
│   │   ├── admin.css       # theme trang quản trị
│   │   ├── common.css
│   │   └── animation.css
│   └── js/
│       ├── guest.js        # logic thiệp khách
│       ├── admin.js        # logic trang quản trị
│       ├── debug-helper.js # (tuỳ chọn) overlay log trên màn hình
│       └── supabase/       # chỉ nạp khi backend.mode = "supabase"
│           ├── supabase-api.js
│           └── api-adapter.js
│
├── server/                 # 🔧 BACKEND — KHÔNG bao giờ được phát ra web
│   ├── config.js           # đọc public/metadata.js (dùng vm với `window` giả)
│   ├── db.js               # data/db.json + băm mật khẩu scrypt
│   ├── auth.js             # token quản trị, khoá khách, chống spam
│   ├── api.js              # toàn bộ route /api/*
│   ├── static.js           # phát file trong public/ (chặn thoát thư mục)
│   └── http.js             # tiện ích dùng chung
│
├── scripts/                # 🧪 CÔNG CỤ DEV — không phát ra web
│   ├── verify-metadata.js  # 65 kiểm tra metadata.js + HTML (jsdom)
│   ├── api-test.sh         # 63 kiểm tra HTTP cho server.js
│   └── termux-start.sh     # start/stop/status trên Android
│
├── docs/                   # 📖 TÀI LIỆU
│   ├── ARCHITECTURE.md     # giải thích cấu trúc & luồng dữ liệu
│   ├── TERMUX.md           # chạy trên điện thoại Android
│   ├── QUICK_START_VI.md   # hướng dẫn nhanh
│   └── SUPABASE_SETUP.md   # nếu chọn backend Supabase
│
└── data/                   # 💾 RUNTIME (tự tạo, đã .gitignore)
    ├── db.json             # toàn bộ lời chúc + tài khoản quản trị
    └── credentials.txt     # mật khẩu quản trị lần đầu (chmod 600)
```

## 🛠️ Customization

**Mọi thứ nằm trong 1 file duy nhất: [`public/metadata.js`](public/metadata.js).**
No URL, name, date, bank account, photo path or CDN link is hardcoded anywhere else —
`index.html`, `dashboard.html`, `test-supabase.html`, `api/*.js`, `dist/guest.js` and
`dist/admin.js` all read from `window.WEDDING_CONFIG`.

| Muốn đổi gì | Mục trong `public/metadata.js` |
|---|---|
| Supabase URL / anon key / table names | `backend` |
| CDN versions (Bootstrap, FontAwesome, fonts) | `cdn` |
| Page title, SEO, favicon, theme colour | `site`, `pages` |
| Bride & groom names, parents, photos, wedding date | `wedding` |
| Ceremony / reception times | `events` |
| Address + Google Maps link | `venue` |
| "Save to Google Calendar" event | `calendar` |
| Bank account, QR, phone number | `gifts` |
| Images, music, video | `media` |
| Footer links | `footer` |
| Confetti on/off, default theme | `ui` |
| Tenor GIF key | `thirdParty.gif` |

### How the wiring works

`metadata.js` được nạp đồng bộ trong `<head>` và:
1. fills the `<title>` / meta / favicon tags,
2. injects the CDN `<link>`/`<script>` tags in the correct order (`async=false`),
3. on `DOMContentLoaded`, sets the `data-*` attributes on `<body>` that
   `dist/guest.js` expects (`data-key`, `data-time`, `data-audio`, ...) and fills every
   element marked with `data-config`, `data-config-src`, `data-config-href`,
   `data-config-attr` or `data-config-list`.

### Change Colors

Edit `css/guest.css` to customize theme colors.

### Verify after editing

```bash
npm install jsdom            # chỉ file test cần jsdom, server thì không
node scripts/verify-metadata.js   # 65 kiểm tra metadata.js + HTML
bash scripts/api-test.sh          # 63 kiểm tra HTTP (cần: node server.js)
npm test                          # chạy cả hai
```

## 📊 Supabase Free Tier

- ✅ 500MB Database
- ✅ 2GB Bandwidth/month
- ✅ 50,000 MAU
- ✅ Perfect for wedding websites!

## 🙏 Credits

Built with ❤️ by [d4m-dev](https://github.com/d4m-dev)

## 📝 License

MIT License - Feel free to use for your wedding!
