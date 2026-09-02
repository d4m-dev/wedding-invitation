# 🏛️ Kiến trúc & cấu trúc dự án

## 1. Nguyên tắc tổ chức

| Nguyên tắc | Áp dụng |
|---|---|
| **Web root tách biệt** | Server chỉ phát `public/`. Source backend, dữ liệu, tài liệu, test nằm ngoài → không thể tải qua HTTP. |
| **Một nguồn cấu hình duy nhất** | `public/metadata.js`. Cả trình duyệt **và** server đều đọc file này. |
| **Backend không dependency** | `server.js` + `server/*` chỉ dùng module có sẵn của Node → chạy được trên Termux. |
| **Không có bước build** | Sửa file là chạy được ngay, không cần transpile/bundle. |

## 2. Cây thư mục

```
wedding-invitation/
├── server.js               # điểm khởi động: node server.js
├── package.json            # npm start / npm test (dependencies: rỗng)
│
├── public/                 # 🌐 WEB ROOT — phát ra ngoài
│   ├── metadata.js         # ⭐ cấu hình duy nhất
│   ├── index.html          # thiệp khách
│   ├── dashboard.html      # trang quản trị
│   ├── test-supabase.html  # kiểm tra kết nối (chỉ khi mode=supabase)
│   ├── assets/{images,music,video}/
│   ├── css/{guest,admin,common,animation}.css
│   └── js/
│       ├── guest.js        # logic thiệp khách
│       ├── admin.js        # logic trang quản trị
│       ├── debug-helper.js # tuỳ chọn
│       └── supabase/       # chỉ nạp khi backend.mode = "supabase"
│
├── server/                 # 🔧 BACKEND — không phát ra web
│   ├── config.js  db.js  auth.js  api.js  static.js  http.js
│
├── scripts/                # 🧪 dev tools — không phát ra web
│   ├── verify-metadata.js  api-test.sh  termux-start.sh
│
├── docs/                   # 📖 tài liệu
│   └── ARCHITECTURE.md  TERMUX.md  QUICK_START_VI.md  SUPABASE_SETUP.md
│
└── data/                   # 💾 runtime (tự tạo, đã .gitignore)
    ├── db.json
    └── credentials.txt     # chmod 600
```

## 3. metadata.js là trung tâm

```
                 ┌──────────────────────────────┐
                 │   public/metadata.js         │
                 │   window.WEDDING_CONFIG      │
                 └──────────────┬───────────────┘
             nạp đồng bộ trong   │   server/config.js đọc bằng
             <head> trình duyệt  │   vm.runInNewContext({window:{}})
                  ┌──────────────┴──────────────┐
                  ▼                             ▼
          TRÌNH DUYỆT                     server.js (Node)
   • điền <title>/meta/favicon        • host, port, dataDir
   • tiêm <link>/<script> CDN         • perPage, rateLimit, corsOrigin
     theo đúng thứ tự, async=false    • guestKey (xác thực khách)
   • gắn data-* lên <body>            • tên admin mặc định
   • điền mọi data-config*
```

Trong HTML, chỗ cần điền giá trị được đánh dấu:

| Thuộc tính | Tác dụng |
|---|---|
| `data-config="a.b.c"` | điền text |
| `data-config-html="a.b.c"` | điền HTML |
| `data-config-src="a.b.c"` | điền `data-src` (lazy) hoặc `src` |
| `data-config-href="a.b.c"` | điền `href` |
| `data-config-attr="ten:a.b.c"` | điền thuộc tính bất kỳ (vd `data-copy`) |
| `data-config-list="a.b" data-config-index="2"` | điền phần tử thứ n của mảng |

## 4. Luồng một lời chúc

```
Khách gõ lời chúc (public/index.html)
      │  public/js/guest.js
      ▼
POST /api/comment?lang=vi      header: x-access-key: <backend.guestKey>
      │  server/api.js
      ▼
validate → đẩy vào db.comments → server/db.js ghi data/db.json (tmp + rename)
      │
      ▼
201 { code:201, data:{uuid, name, comment, like_count, own, ...} }
      │
      ▼
guest.js chèn thẳng vào DOM, không cần tải lại trang
```

Xác thực:
- **Khách** → header `x-access-key` (giá trị = `backend.guestKey` trong metadata.js)
- **Quản trị** → `Authorization: Bearer <token>`; token có đúng 3 phần
  (`dist/admin.js` kiểm tra `token.split(".").length === 3`), ký HMAC-SHA256, hết hạn 12 giờ

## 5. Bảng route

| Method | Đường dẫn | Ai gọi được | Trả về |
|---|---|---|---|
| GET | `/api/health` | công khai | trạng thái server |
| GET | `/api/session?key=` | khách | `{token}` |
| POST | `/api/session` | công khai | `{token}` (admin, 3 phần) |
| GET | `/api/v2/config` | công khai | `can_reply/can_edit/can_delete/tenor_key` |
| GET | `/api/v2/comment?per&next` | công khai | `{count, lists[]}` + trả lời + số like |
| POST | `/api/comment` | khách | 201 lời chúc mới |
| POST | `/api/comment/:uuid` | khách | 201 `{uuid: likeId}` (thích) |
| PATCH | `/api/comment/:likeId` | khách | bỏ thích (không body) |
| PUT | `/api/comment/:uuid` | admin/chủ | sửa |
| DELETE | `/api/comment/:uuid` | admin/chủ | xoá + các trả lời |
| GET/PUT | `/api/user` | admin | thông tin / đổi tên, mật khẩu, tenor key |
| GET | `/api/stats` | admin | đếm lời chúc, like, có mặt, vắng |
| POST | `/api/key` | admin | tạo lại access key |
| GET | `/api/download` | admin | CSV (có BOM cho Excel) |

## 6. Bảo mật

- Chỉ phát `public/`; từ chối mọi đường dẫn thoát khỏi thư mục đó (`../`)
- Chặn file ẩn (`.git`, `.env`, `.gitignore`) kể cả nếu lọt vào `public/`
- `data/` nằm ngoài web root → `data/db.json` và `credentials.txt` không tải được
- Mật khẩu quản trị băm **scrypt** (N=16384), so sánh bằng `timingSafeEqual`
- Token ký HMAC-SHA256, so sánh bằng `timingSafeEqual`, có hạn dùng
- Giới hạn body 256 KB, giới hạn số request/phút theo IP
- Ghi DB theo kiểu nguyên tử (`.tmp` + `rename`) — mất điện không hỏng dữ liệu
- **Không để secret trong `public/metadata.js`** — file này ai cũng tải được

## 7. Kiểm thử

```bash
npm install jsdom --no-save       # chỉ test front/render cần jsdom; server thì không
node scripts/verify-metadata.js   # 67 kiểm tra: metadata.js + HTML thật trong jsdom
bash scripts/api-test.sh          # 63 kiểm tra: HTTP thật (cần server đang chạy)
node scripts/render-check.js      # mở trang thật trong jsdom, khẳng định #root hiện ra
npm test                          # chạy cả ba
```

`render-check.js` là test hồi quy cho lỗi "trang trắng": `<div id="root">` mang
`opacity-0` và chỉ hiện ra khi `undangan.progress.done` bắn. Chạy mặc định ở
`MODE=BLOCKED` (mọi CDN/host ngoài đều chết) để chắc chắn trang **vẫn** hiện ra.

## 8. Đổi backend

`public/metadata.js` → `backend.mode`:

| Giá trị | Hành vi |
|---|---|
| `"node"` (mặc định) | dùng `server.js`; **không** nạp `public/js/supabase/*` |
| `"supabase"` | trang web tự nạp `supabase-api.js` + `api-adapter.js` |

Đổi `apiBase` nếu web và API nằm ở 2 nơi khác nhau (vd web trên GitHub Pages,
API chạy trên điện thoại ở nhà).
