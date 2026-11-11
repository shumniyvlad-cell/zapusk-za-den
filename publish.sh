#!/usr/bin/env bash
# «Запуск за день» → https://marchvlv.ru/den/ («Час», 83.141.94.106, вход через Пульт).
# Статика в /var/www/den; в блок marchvlv.ru Caddy один раз добавляются /den и /den/*.
#   ./publish.sh
set -euo pipefail
cd "$(dirname "$0")"
CHAS="root@83.141.94.106"
SSH=(ssh -i ~/.ssh/id_ed25519_chas -J pult)

TMP=$(mktemp -d)
rsync -a --exclude '.git' --exclude '.gitignore' --exclude '.nojekyll' --exclude 'publish.sh' --exclude '.DS_Store' ./ "$TMP/"

"${SSH[@]}" "$CHAS" 'install -d -m 755 /var/www/den'
rsync -rltz --delete -e "ssh -i $HOME/.ssh/id_ed25519_chas -J pult" "$TMP/" "$CHAS:/var/www/den/"
"${SSH[@]}" "$CHAS" 'chmod -R a+rX /var/www/den'

"${SSH[@]}" "$CHAS" 'bash -s' <<'REMOTE'
set -euo pipefail
CF=/etc/caddy/Caddyfile
if ! grep -q 'handle_path /den/\*' "$CF"; then
  BAK="$CF.bak-den-$(date +%s)"
  cp "$CF" "$BAK"
  python3 - "$CF" <<'PY'
import sys
cf = sys.argv[1]
s = open(cf).read()
anchor = "\t# гайд «ИИ-монтажёр в Edits»"
assert anchor in s, "не нашёл место для вставки в Caddyfile"
block = """\t# «Запуск за день»: статика из /var/www/den, заявки идут в личку @marchvlvv
\tredir /den /den/ 308
\thandle_path /den/* {
\t\troot * /var/www/den
\t\tfile_server
\t}
"""
open(cf, "w").write(s.replace(anchor, block + anchor, 1))
PY
  if ! caddy validate --config "$CF" --adapter caddyfile >/dev/null 2>&1; then
    echo "Caddyfile не прошёл проверку, возвращаю прежний"; cp "$BAK" "$CF"; exit 1
  fi
  systemctl reload caddy
  echo "Caddy: добавлен /den"
else
  echo "Caddy: /den уже есть"
fi
REMOTE
rm -rf "$TMP"
sleep 2
for u in https://marchvlv.ru/den https://marchvlv.ru/den/ https://marchvlv.ru/den/css/style.css https://marchvlv.ru/den/img/og.jpg https://marchvlv.ru/edits/ https://marchvlv.ru/planb/ https://marchvlv.ru/zavod/ https://marchvlv.ru/; do
  printf '%s %s\n' "$(curl -s -o /dev/null -m 15 -w '%{http_code} → %{redirect_url}' "$u")" "$u"
done
