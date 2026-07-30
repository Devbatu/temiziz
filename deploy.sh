#!/usr/bin/env bash
# Docker'ı destekleyen bir sunucuya (VPS) tek komutla dağıtım.
#
#   ./deploy.sh kullanici@sunucu-ip [ssh-portu]
#
# Yaptığı iş: kaynağı sunucuya kopyalar, orada imajı derler, eski konteyneri
# değiştirir ve sağlık kontrolü yapar. Paylaşımlı hostingde ÇALIŞMAZ.

set -euo pipefail

TARGET="${1:-}"
PORT="${2:-22}"
APP_DIR="/opt/celaning"

if [[ -z "$TARGET" ]]; then
  echo "Kullanım: ./deploy.sh kullanici@sunucu-ip [ssh-portu]" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "HATA: .env dosyası yok. Önce 'cp .env.example .env' çalıştırıp doldurun." >&2
  exit 1
fi

echo "▸ Sunucuda Docker kontrol ediliyor…"
ssh -p "$PORT" "$TARGET" 'command -v docker >/dev/null 2>&1' || {
  echo "HATA: Sunucuda Docker bulunamadı. Kurmak için:" >&2
  echo "  curl -fsSL https://get.docker.com | sh" >&2
  exit 1
}

echo "▸ Kaynak kopyalanıyor…"
ssh -p "$PORT" "$TARGET" "mkdir -p $APP_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git \
  -e "ssh -p $PORT" ./ "$TARGET:$APP_DIR/"

# .env rsync'ten hariç tutulmadı ama ayrıca gönderiyoruz ki izinleri sıkı olsun.
scp -P "$PORT" .env "$TARGET:$APP_DIR/.env"
ssh -p "$PORT" "$TARGET" "chmod 600 $APP_DIR/.env"

echo "▸ Sunucuda derleniyor ve başlatılıyor…"
ssh -p "$PORT" "$TARGET" "cd $APP_DIR && docker compose up -d --build"

echo "▸ Sağlık kontrolü…"
for i in $(seq 1 20); do
  if ssh -p "$PORT" "$TARGET" "curl -sf http://127.0.0.1:3000/robots.txt >/dev/null"; then
    echo "✓ Uygulama ayakta: http://<sunucu>:3000"
    ssh -p "$PORT" "$TARGET" "cd $APP_DIR && docker compose ps"
    exit 0
  fi
  sleep 3
done

echo "HATA: Uygulama 60 saniyede yanıt vermedi. Günlükler:" >&2
ssh -p "$PORT" "$TARGET" "cd $APP_DIR && docker compose logs --tail=50" >&2
exit 1
