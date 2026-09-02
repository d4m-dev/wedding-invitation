#!/bin/bash
# =============================================================================
#  scripts/api-test.sh — 5x kiểm tra HTTP thật cho server.js
#  Cần server đang chạy:  node server.js
# =============================================================================
cd "$(dirname "$0")/.." || exit 1
B=http://127.0.0.1:8080
K="x-access-key: public-guest"
pass=0; fail=0
chk() { # chk "label" "actual" "expected"
  if [ "$2" == "$3" ]; then echo "PASS | $1 = $2"; pass=$((pass+1));
  else echo "FAIL | $1  actual=[$2] expected=[$3]"; fail=$((fail+1)); fi
}
j() { python3 -c 'import sys,json
d=json.load(sys.stdin)
print(eval("d"+sys.argv[1]))' "$1" 2>/dev/null; }

echo "=== 1. health ==="
chk "health" "$(curl -s $B/api/health | j "['data']['status']")" "ok"

echo "=== 2. session khach ==="
chk "token khach" "$(curl -s "$B/api/session?key=public-guest" | j "['data']['token']")" "public-guest"
chk "sai khoa -> 401" "$(curl -s -o /dev/null -w '%{http_code}' "$B/api/session?key=sai")" "401"

echo "=== 3. config ==="
chk "can_reply" "$(curl -s -H "$K" $B/api/v2/config | j "['data']['can_reply']")" "True"
chk "can_delete (khach)" "$(curl -s -H "$K" $B/api/v2/config | j "['data']['can_delete']")" "False"

echo "=== 4. danh sach rong ==="
chk "count ban dau" "$(curl -s -H "$K" "$B/api/v2/comment?per=10&next=0" | j "['data']['count']")" "0"

echo "=== 5. tao loi chuc ==="
R=$(curl -s -o /tmp/r1 -w '%{http_code}' -X POST -H "$K" -H 'Content-Type: application/json' \
    -d '{"id":null,"name":"Nguyễn Văn A","presence":true,"comment":"Chúc trăm năm hạnh phúc!","gif_id":null}' "$B/api/comment?lang=vi")
chk "status 201" "$R" "201"
UUID=$(j "['data']['uuid']" < /tmp/r1)
chk "own" "$(j "['data']['own']" < /tmp/r1)" "True"
chk "is_parent" "$(j "['data']['is_parent']" < /tmp/r1)" "True"
chk "presence (true -> 1)" "$(j "['data']['presence']" < /tmp/r1)" "1"
chk "like_count" "$(j "['data']['like_count']" < /tmp/r1)" "0"
echo "       uuid=$UUID"

echo "=== 6. tra loi ==="
R=$(curl -s -o /tmp/r2 -w '%{http_code}' -X POST -H "$K" -H 'Content-Type: application/json' \
    -d "{\"id\":\"$UUID\",\"name\":\"Trần Thị B\",\"presence\":false,\"comment\":\"Cảm ơn bạn!\",\"gif_id\":null}" "$B/api/comment?lang=vi")
chk "status 201" "$R" "201"
REPLY=$(j "['data']['uuid']" < /tmp/r2)
chk "is_parent (tra loi)" "$(j "['data']['is_parent']" < /tmp/r2)" "False"
chk "presence (false -> 2)" "$(j "['data']['presence']" < /tmp/r2)" "2"

echo "=== 7. thich (like) ==="
R=$(curl -s -o /tmp/r3 -w '%{http_code}' -X POST -H "$K" "$B/api/comment/$UUID")
chk "status 201" "$R" "201"
LIKE=$(j "['data']['uuid']" < /tmp/r3)
echo "       likeId=$LIKE"

echo "=== 8. doc lai ==="
L=$(curl -s -H "$K" "$B/api/v2/comment?per=10&next=0")
chk "count cha" "$(echo "$L" | j "['data']['count']")" "1"
chk "like_count" "$(echo "$L" | j "['data']['lists'][0]['like_count']")" "1"
chk "so tra loi" "$(echo "$L" | j "['data']['lists'][0]['comments'].__len__()")" "1"
chk "ten tra loi" "$(echo "$L" | j "['data']['lists'][0]['comments'][0]['name']")" "Trần Thị B"
chk "ip duoc ghi" "$(echo "$L" | j "['data']['lists'][0]['ip'] != ''")" "True"

echo "=== 9. sua loi chuc (PUT) ==="
chk "PUT status" "$(curl -s -X PUT -H "$K" -H 'Content-Type: application/json' \
    -d '{"presence":true,"comment":"Đã sửa nội dung","id":null}' "$B/api/comment/$UUID?lang=vi" | j "['data']['status']")" "True"
chk "noi dung moi" "$(curl -s -H "$K" "$B/api/v2/comment?per=10" | j "['data']['lists'][0]['comment']")" "Đã sửa nội dung"

echo "=== 10. bo thich (PATCH khong body) ==="
chk "PATCH status" "$(curl -s -X PATCH -H "$K" "$B/api/comment/$LIKE" | j "['data']['status']")" "True"
chk "like_count ve 0" "$(curl -s -H "$K" "$B/api/v2/comment?per=10" | j "['data']['lists'][0]['like_count']")" "0"

echo "=== 11. dang nhap quan tri ==="
PW=$(grep -oP 'Password: \K.*' data/credentials.txt)
R=$(curl -s -o /tmp/login -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    -d "{\"email\":\"admin@wedding.local\",\"password\":\"$PW\"}" $B/api/session)
chk "login 200" "$R" "200"
TOK=$(j "['data']['token']" < /tmp/login)
chk "token co 3 phan (client can)" "$(echo -n "$TOK" | awk -F. '{print NF}')" "3"
chk "sai mat khau -> 401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    -d '{"email":"admin@wedding.local","password":"sai"}' $B/api/session)" "401"
A="Authorization: Bearer $TOK"

echo "=== 12. khu vuc quan tri ==="
chk "GET /api/user email" "$(curl -s -H "$A" $B/api/user | j "['data']['email']")" "admin@wedding.local"
chk "/api/user khong lo mat khau" "$(curl -s -H "$A" $B/api/user | grep -c 'password')" "0"
chk "stats comments" "$(curl -s -H "$A" $B/api/stats | j "['data']['comments']")" "2"
chk "stats present" "$(curl -s -H "$A" $B/api/stats | j "['data']['present']")" "1"
chk "stats absent" "$(curl -s -H "$A" $B/api/stats | j "['data']['absent']")" "1"
chk "khong token -> 401" "$(curl -s -o /dev/null -w '%{http_code}' $B/api/stats)" "401"
chk "can_delete (admin)" "$(curl -s -H "$A" $B/api/v2/config | j "['data']['can_delete']")" "True"
chk "CSV co header" "$(curl -s -H "$A" $B/api/download | head -1 | sed 's/^\xef\xbb\xbf//' | cut -d, -f1-2)" "uuid,parent_uuid"

echo "=== 13. xoa (kem xoa tra loi) ==="
chk "DELETE status" "$(curl -s -X DELETE -H "$K" "$B/api/comment/$UUID" | j "['data']['status']")" "True"
chk "count ve 0" "$(curl -s -H "$K" "$B/api/v2/comment?per=10" | j "['data']['count']")" "0"
chk "xoa ca tra loi (stats)" "$(curl -s -H "$A" $B/api/stats | j "['data']['comments']")" "0"

echo "=== 14. bao mat ==="
# data/ nam NGOAI public/ nen server tra 404 (khong tim thay trong web root)
chk "chan ../data/db.json" "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "$B/../data/db.json")" "404"
chk "chan /data/db.json" "$(curl -s -o /dev/null -w '%{http_code}' "$B/data/db.json")" "404"
chk "chan /data/credentials.txt" "$(curl -s -o /dev/null -w '%{http_code}' "$B/data/credentials.txt")" "404"
chk "404 route la" "$(curl -s -o /dev/null -w '%{http_code}' $B/api/khong-ton-tai)" "404"
chk "ten ngan -> 400" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "$K" -H 'Content-Type: application/json' -d '{"name":"A","comment":"x"}' $B/api/comment)" "400"

echo "=== 15. phuc vu web ==="
chk "GET / -> 200" "$(curl -s -o /dev/null -w '%{http_code}' $B/)" "200"
chk "index.html nap metadata.js" "$([ $(curl -s $B/ | grep -c 'metadata.js') -gt 0 ] && echo yes)" "yes"
chk "metadata.js -> 200" "$(curl -s -o /dev/null -w '%{http_code}' $B/metadata.js)" "200"
chk "css/guest.css -> 200" "$(curl -s -o /dev/null -w '%{http_code}' $B/css/guest.css)" "200"
chk "js/guest.js -> 200" "$(curl -s -o /dev/null -w '%{http_code}' $B/js/guest.js)" "200"
chk "nhac mp3 -> 200" "$(curl -s -o /dev/null -w '%{http_code}' $B/assets/music/weddingsongs_ido.mp3)" "200"
chk "khong tai supabase-api (mode=node)" "$(curl -s $B/ | grep -c 'supabase-api')" "0"
chk "MIME js dung" "$(curl -s -o /dev/null -w '%{content_type}' $B/metadata.js)" "text/javascript; charset=utf-8"

echo "=== 16. khong lo source code / du lieu ra ngoai ==="
for p in /.git/config /.gitignore /.env.example /server.js /server/db.js /server/api.js /package.json /data/db.json /data/credentials.txt /node_modules/jsdom/package.json /README.md; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "$B$p")
  chk "chan $p" "$code" "$([ "$code" == "200" ] && echo 'LO-HONG-200' || echo "$code")"
done
chk "khong co file nao 200" "$(for p in /.git/config /server.js /server/db.js /data/db.json /package.json; do curl -s -o /dev/null -w '%{http_code}' --path-as-is "$B$p"; done | grep -c 200)" "0"

echo
echo ">>> PASS: $pass   FAIL: $fail"
[ $fail -eq 0 ] && exit 0 || exit 1
