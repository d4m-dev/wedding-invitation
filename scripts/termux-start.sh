#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
#  termux-start.sh — khởi động backend thiệp cưới trên Android/Termux
#  Dùng:  bash termux-start.sh          (chạy nền, khoá chế độ ngủ)
#         bash termux-start.sh stop     (dừng server)
#         bash termux-start.sh status   (xem trạng thái)
# =============================================================================
set -u
cd "$(dirname "$0")/.." || exit 1

PORT=$(node -e "try{const s={};const vm=require('vm');const sb={window:{},console};
vm.runInNewContext(require('fs').readFileSync('public/metadata.js','utf8')+';__C=window.WEDDING_CONFIG;',sb);
process.stdout.write(String((sb.__C.server||{}).port||8080))}catch(e){process.stdout.write('8080')}" 2>/dev/null || echo 8080)
LOG=server.log

case "${1:-start}" in
  stop)
    pkill -f "node server.js" && echo "🛑 Đã dừng server." || echo "Server không chạy."
    command -v termux-wake-unlock >/dev/null && termux-wake-unlock
    exit 0
    ;;
  status)
    if pgrep -f "node server.js" >/dev/null; then
      echo "✅ Server đang chạy (PID $(pgrep -f 'node server.js' | tr '\n' ' '))"
      curl -s "http://127.0.0.1:$PORT/api/health" && echo
    else
      echo "❌ Server không chạy."
    fi
    exit 0
    ;;
esac

# 1. Kiểm tra Node
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Chưa có Node.js. Chạy:  pkg install -y nodejs-lts"
  exit 1
fi
echo "Node: $(node -v)"

# 2. Không cho Android cho máy ngủ
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  echo "🔋 Đã bật termux-wake-lock"
fi

# 3. Không chạy 2 lần
if pgrep -f "node server.js" >/dev/null; then
  echo "⚠️  Server đã chạy sẵn (PID $(pgrep -f 'node server.js')). Dừng bằng: bash termux-start.sh stop"
  exit 1
fi

# 4. Chạy nền
nohup node server.js > "$LOG" 2>&1 &
sleep 2

if pgrep -f "node server.js" >/dev/null; then
  echo "🚀 Server đã chạy nền, log: $LOG"
  echo
  grep -E "Password|http" "$LOG" 2>/dev/null | sed 's/^/   /'
  echo
  echo "   Dừng server: bash termux-start.sh stop"
else
  echo "❌ Khởi động thất bại, xem log:"
  cat "$LOG"
  exit 1
fi
