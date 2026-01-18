# Hướng Dẫn Setup Supabase cho Guestbook

## Bước 1: Tạo Tài Khoản Supabase

1. Truy cập https://supabase.com
2. Click "Start your project" và đăng ký bằng GitHub
3. Tạo một project mới (tên gì cũng được, ví dụ: `wedding-invitation`)
4. Chọn region gần Việt Nam nhất (Singapore hoặc Tokyo)
5. Đợi project khởi tạo (~2 phút)

## Bước 2: Tạo Database Table

1. Vào **SQL Editor** trong dashboard Supabase
2. Copy và chạy SQL sau:

```sql
-- Tạo bảng comments
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  presence INTEGER DEFAULT 0 CHECK (presence IN (0, 1, 2)),
  comment TEXT NOT NULL,
  gif_url TEXT,
  parent_uuid UUID REFERENCES comments(uuid) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng likes
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_uuid UUID REFERENCES comments(uuid) ON DELETE CASCADE NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_uuid, ip_address)
);

-- Index để tăng tốc queries
CREATE INDEX idx_comments_parent ON comments(parent_uuid);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_likes_comment ON likes(comment_uuid);

-- Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies cho comments (cho phép mọi người đọc và tạo mới)
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (true);

-- Policies cho likes
CREATE POLICY "Anyone can read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete likes" ON likes FOR DELETE USING (true);

-- Function để đếm số likes
CREATE OR REPLACE FUNCTION get_like_count(comment_uuid_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM likes WHERE comment_uuid = comment_uuid_param;
$$ LANGUAGE SQL STABLE;

-- Function để kiểm tra đã like chưa
CREATE OR REPLACE FUNCTION has_liked(comment_uuid_param UUID, ip_param INET)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM likes WHERE comment_uuid = comment_uuid_param AND ip_address = ip_param);
$$ LANGUAGE SQL STABLE;
```

3. Click "Run" để tạo tables

## Bước 3: Lấy API Keys

1. Vào **Settings > API** trong Supabase dashboard
2. Copy 2 thông tin sau:
   - **Project URL** (ví dụ: `https://abcxyz.supabase.co`)
   - **anon public** key (key dài, bắt đầu bằng `eyJ...`)

## Bước 4: Cấu Hình Website

1. Mở file `index.html`
2. Tìm dòng có comment `<!--<body data-key="" data-url=""...`
3. Bỏ comment và điền thông tin:

```html
<body 
  data-url="https://YOUR-PROJECT-URL.supabase.co/rest/v1" 
  data-key="YOUR-ANON-PUBLIC-KEY"
  data-audio="./assets/music/weddingsongs_ido.mp3" 
  data-confetti="true" 
  data-time="2026-12-22 07:30:00">
```

**Lưu ý**: 
- Thay `YOUR-PROJECT-URL` bằng URL project của bạn
- Thay `YOUR-ANON-PUBLIC-KEY` bằng anon key của bạn
- URL phải có `/rest/v1` ở cuối

## Bước 5: Deploy

1. Commit và push lên GitHub:
```bash
git add .
git commit -m "Add Supabase backend for guestbook"
git push
```

2. Đợi GitHub Pages rebuild (~1-2 phút)
3. Test tại: https://d4m-dev.github.io/wedding-invitation/

## Bước 6: (Tùy Chọn) Xem Database

Vào **Table Editor** trong Supabase để xem comments và likes real-time!

---

## Troubleshooting

### Lỗi CORS
- Vào **Settings > API** trong Supabase
- Thêm domain của bạn vào **CORS Allowed Origins**
- Thêm: `https://d4m-dev.github.io`

### Comments không hiển thị
- Kiểm tra Console trong DevTools (F12)
- Đảm bảo đã enable RLS policies (xem Bước 2)
- Kiểm tra lại `data-url` và `data-key`

### Free Tier Limits
- 500MB database
- 2GB bandwidth/tháng
- 50,000 Monthly Active Users
- Đủ cho hầu hết wedding websites!

---

**Hoàn tất!** 🎉 Giờ website của bạn đã có backend miễn phí từ Supabase!
