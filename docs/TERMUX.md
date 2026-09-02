# 📱 Chạy thiệp cưới trên điện thoại Android (Termux)

Dự án này **không cần `npm install`** — backend là 1 file `server.js` chỉ dùng module có
sẵn của Node. Vì vậy chạy trên điện thoại rất nhẹ.

---

## 1. Cài Termux

Cài từ **F-Droid** hoặc **GitHub**, *không* cài từ Google Play (bản trên Play đã cũ, dễ lỗi).

- F-Droid: https://f-droid.org/packages/com.termux/
- GitHub: https://github.com/termux/termux-app/releases

## 2. Cài Node.js

```bash
pkg update -y
pkg install -y nodejs-lts git
node -v        # phải ra v18 trở lên
```

## 3. Đưa project vào điện thoại

**Cách A — clone từ GitHub**

```bash
git clone https://github.com/d4m-dev/wedding-invitation.git
cd wedding-invitation
```

**Cách B — chép thư mục từ máy tính**

```bash
termux-setup-storage          # cấp quyền truy cập bộ nhớ (bấm Cho phép)
cp -r /sdcard/Download/wedding-invitation ~/
cd ~/wedding-invitation
```

## 4. Chạy

```bash
node server.js
```

Màn hình sẽ hiện:

```
──────────────────────────────────────────────────────────────
  🔑 TÀI KHOẢN QUẢN TRỊ (dashboard.html) — lưu lại ngay!
     Email   : admin@wedding.local
     Password: xxxxxxxxxxxx
──────────────────────────────────────────────────────────────

💒 Backend thiệp cưới đã chạy!
   Trên máy này: http://127.0.0.1:8080
   📱 Máy khác trong cùng WiFi mở: http://192.168.1.20:8080
```

> **Ghi lại mật khẩu ngay.** Nó cũng được lưu trong `data/credentials.txt`.
> Đăng nhập `dashboard.html` rồi đổi mật khẩu trong mục Cài đặt.

Hoặc dùng script có sẵn (tự khoá màn hình ngủ + ghi log):

```bash
bash scripts/termux-start.sh
```

## 5. Mở thiệp

| Mở ở đâu | Địa chỉ |
|---|---|
| Ngay trên điện thoại | http://127.0.0.1:8080 |
| Máy khác cùng WiFi | `http://<IP-điện-thoại>:8080` (IP hiện trong log khi khởi động) |
| Trang quản trị | `http://<IP-điện-thoại>:8080/dashboard.html` |

Xem IP của điện thoại bất cứ lúc nào:

```bash
ip addr show wlan0 | grep 'inet '
```

---

## 6. Để server chạy nền, không bị Android tắt

```bash
termux-wake-lock                          # không cho máy ngủ
nohup node server.js > server.log 2>&1 &  # chạy nền, log ra server.log
tail -f server.log                        # xem log
```

Dừng server:

```bash
pkill -f "node server.js"
termux-wake-unlock
```

**Lưu ý quan trọng trên Android:**

1. Vào *Cài đặt → Ứng dụng → Termux → Pin* và chọn **Không giới hạn / Không tối ưu pin**.
2. Vuốt Termux trong danh sách app gần đây và bấm **🔒 Khoá** để hệ thống không dọn.
3. Khi điện thoại tắt WiFi hoặc chuyển sang 4G, IP sẽ đổi → địa chỉ mở thiệp đổi theo.
4. Khách ở **ngoài** mạng WiFi nhà bạn sẽ không vào được. Muốn mở ra Internet thì cần
   một trong các cách: Cloudflare Tunnel, Tailscale, hoặc mở cổng (port forwarding) trên
   router — nói mình biết nếu bạn cần, mình cấu hình cho.

---

## 7. Sao lưu dữ liệu

Toàn bộ lời chúc nằm trong **1 file duy nhất**:

```bash
cat data/db.json          # xem
cp data/db.json /sdcard/Download/db-$(date +%F).json   # chép ra bộ nhớ máy
```

Muốn khôi phục: chép file đè lại `data/db.json` rồi khởi động lại server.

---

## 8. Đổi cấu hình

Mọi thứ nằm trong **`public/metadata.js`** — kể cả cấu hình máy chủ:

```js
server: {
    host: "0.0.0.0",     // 0.0.0.0 = cho máy khác trong WiFi truy cập
    port: 8080,          // đổi cổng ở đây
    dataDir: "./data",
    perPage: 10,
    rateLimitPerMinute: 30
},
```

Đổi cổng nhanh mà không cần sửa file:

```bash
node server.js --port 3000
PORT=3000 node server.js
```

Đổi email/mật khẩu quản trị ngay từ lần tạo đầu tiên:

```bash
ADMIN_EMAIL=chuere@example.com ADMIN_PASSWORD=mat-khau-manh node server.js
```

---

## 9. Kiểm tra mọi thứ còn chạy đúng không

```bash
node scripts/verify-metadata.js   # 65 kiểm tra metadata.js + HTML
bash scripts/api-test.sh          # 63 kiểm tra API (cần server đang chạy)
npm test                          # chạy cả hai
curl http://127.0.0.1:8080/api/health
```

## 10. Quay lại backend Supabase (nếu muốn)

Chỉ cần đổi 1 dòng trong `public/metadata.js`:

```js
backend: {
    mode: "supabase",     // thay vì "node"
    supabaseUrl: "https://xxx.supabase.co/rest/v1",
    supabaseAnonKey: "eyJ...",
}
```

Trang web sẽ tự nạp lại `public/js/supabase/supabase-api.js` + `api-adapter.js`. Không phải sửa
bất kỳ file nào khác.
