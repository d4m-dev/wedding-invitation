# 🚀 Hướng Dẫn Nhanh - Thiết Lập Backend Supabase

## Tóm Tắt 3 Bước

### Bước 1️⃣: Tạo Tài Khoản Supabase (2 phút)

1. Vào https://supabase.com
2. Click **"Start your project"** → Đăng nhập bằng GitHub
3. Click **"New Project"**
   - Tên project: `wedding-invitation` (hoặc tên bạn thích)
   - Password: tạo password mạnh (lưu lại)
   - Region: chọn **Southeast Asia (Singapore)**
4. Click **"Create new project"** → Đợi ~2 phút

### Bước 2️⃣: Tạo Database (1 phút)

1. Trong Supabase dashboard, chọn **"SQL Editor"** (thanh bên trái)
2. Click **"New query"**
3. Copy TOÀN BỘ code SQL từ file [SUPABASE_SETUP.md](SUPABASE_SETUP.md#bước-2-tạo-database-table) (từ dòng `-- Tạo bảng comments` đến hết)
4. Paste vào SQL Editor
5. Click **"Run"** (hoặc nhấn Ctrl+Enter)
6. Thấy ✅ "Success" là xong!

### Bước 3️⃣: Cấu Hình Website (1 phút)

1. Trong Supabase, vào **Settings → API** (thanh bên trái)
2. Copy 2 thông tin:
   - **URL**: phần "Project URL" (VD: `https://abc123xyz.supabase.co`)
   - **KEY**: phần "anon public" (key dài, bắt đầu `eyJ...`)

3. Mở file `index.html` trong project này
4. Tìm dòng 75, thay đổi:

```html
<!-- TRƯỚC (dòng 75-79) -->
<body 
    data-url="YOUR_SUPABASE_URL/rest/v1" 
    data-key="YOUR_SUPABASE_KEY"
    ...>

<!-- SAU (thay bằng thông tin của bạn) -->
<body 
    data-url="https://abc123xyz.supabase.co/rest/v1" 
    data-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M..."
    ...>
```

**LƯU Ý**: 
- URL phải kết thúc bằng `/rest/v1`
- Key dài ~200-300 ký tự
- Không có dấu ngoặc kép hoặc khoảng trắng thừa

### Bước 4️⃣: Deploy (30 giây)

```bash
git add .
git commit -m "Add Supabase backend for guestbook"
git push
```

Đợi 1-2 phút → Vào https://d4m-dev.github.io/wedding-invitation/ để test!

---

## ✅ Kiểm Tra Hoạt Động

1. Mở website
2. Cuộn xuống phần **"Lời chúc phúc"**
3. Điền tên, chọn "Tham dự", viết lời chúc
4. Click **"Gửi"**
5. Nếu thành công → Comment xuất hiện ngay lập tức! 🎉

---

## 🐛 Lỗi Thường Gặp

### "Không gửi được comment"
- ✅ Kiểm tra `data-url` có `/rest/v1` ở cuối chưa
- ✅ Kiểm tra `data-key` copy đầy đủ chưa
- ✅ Mở DevTools (F12) → Console tab xem lỗi gì

### "CORS Error"
Vào Supabase: **Settings → API → CORS Allowed Origins**
Thêm: `https://d4m-dev.github.io`

### "Comments không hiển thị"
- ✅ Đã chạy SQL ở Bước 2 chưa?
- ✅ Vào **Table Editor** trong Supabase xem có bảng `comments` không

---

## 📞 Hỗ Trợ

Gặp vấn đề? 
1. Xem hướng dẫn chi tiết: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. Kiểm tra Console (F12) xem lỗi gì
3. Tạo Issue trên GitHub

---

**Chúc bạn thiết lập thành công! 🎊**
