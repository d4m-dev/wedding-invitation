# Wedding Invitation Website 💒💍

Beautiful digital wedding invitation with guestbook feature powered by Supabase.

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

## 🚀 Quick Setup

### 1. Setup Supabase Backend (Free!)

Follow the detailed guide: **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

Quick steps:
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Run SQL from setup guide to create tables
4. Get your Project URL and API Key

### 2. Configure Website

Edit `index.html` and replace placeholders:

```html
<body 
    data-url="https://YOUR-PROJECT.supabase.co/rest/v1" 
    data-key="YOUR_ANON_PUBLIC_KEY"
    ...
>
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
├── index.html              # Main invitation page
├── dashboard.html          # Admin dashboard (if needed)
├── api/
│   └── supabase-api.js    # Supabase API wrapper
├── dist/
│   ├── guest.js           # Frontend logic
│   └── admin.js           # Admin logic
├── css/                    # Stylesheets
├── assets/                 # Images, music, videos
└── SUPABASE_SETUP.md      # Detailed setup guide
```

## 🛠️ Customization

### Change Wedding Info

Edit these sections in `index.html`:
- Names: Line ~103 (`Thừa Ân & [Người Thương]`)
- Date: Line 75 (`data-time="2026-12-22 07:30:00"`)
- Location: Line ~323 (Google Maps link)
- Photos: Replace files in `assets/images/`

### Change Colors

Edit `css/guest.css` to customize theme colors.

### Change Music

Replace `assets/music/weddingsongs_ido.mp3` with your music file.

## 📊 Supabase Free Tier

- ✅ 500MB Database
- ✅ 2GB Bandwidth/month
- ✅ 50,000 MAU
- ✅ Perfect for wedding websites!

## 🙏 Credits

Built with ❤️ by [d4m-dev](https://github.com/d4m-dev)

## 📝 License

MIT License - Feel free to use for your wedding!
