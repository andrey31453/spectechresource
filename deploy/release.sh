#!/usr/bin/env bash
set -euo pipefail
umask 077
release=${1:?Release ID required}
[[ "$release" =~ ^[a-f0-9]{40}-[0-9]+$ ]] || exit 1
base=/opt/spectech
dir="$base/releases/$release"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl xz-utils openssl postgresql nginx certbot python3-certbot-nginx
if ! /usr/local/bin/node --version 2>/dev/null | grep -q '^v24\.'; then
  node_version=v24.22.3
  case "$(uname -m)" in x86_64) arch=x64;; aarch64) arch=arm64;; *) exit 1;; esac
  tmp=$(mktemp -d)
  curl -fsS "https://nodejs.org/dist/$node_version/node-$node_version-linux-$arch.tar.xz" -o "$tmp/node.tar.xz"
  curl -fsS "https://nodejs.org/dist/$node_version/SHASUMS256.txt" -o "$tmp/checksums"
  expected=$(grep " node-$node_version-linux-$arch.tar.xz$" "$tmp/checksums" | cut -d ' ' -f1)
  echo "$expected  $tmp/node.tar.xz" | sha256sum -c -
  tar -xJf "$tmp/node.tar.xz" -C /usr/local --strip-components=1
  rm -rf "$tmp"
fi
export PATH=/usr/local/bin:$PATH
id spectech >/dev/null 2>&1 || useradd --system --home-dir "$base" --shell /usr/sbin/nologin spectech
install -d -m 750 "$base/shared" "$base/backups" "$base/releases"
install -d -o spectech -g spectech -m 750 "$base/shared/uploads"
chgrp spectech "$base/shared"
systemctl enable --now postgresql
if [[ ! -f "$base/shared/app.env" ]]; then
  db_password=$(openssl rand -hex 32)
  session_secret=$(openssl rand -hex 48)
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "CREATE USER spectech WITH PASSWORD '$db_password';" >/dev/null
  runuser -u postgres -- createdb -O spectech spectech
  cat > "$base/shared/app.env" <<ENV
DATABASE_URL=postgresql://spectech:$db_password@127.0.0.1:5432/spectech
NUXT_SESSION_SECRET=$session_secret
NUXT_PUBLIC_SITE_URL=https://specteh.online
NUXT_LEADS_DRY_RUN=true
NUXT_BITRIX24_WEBHOOK_URL=
NUXT_UPLOADS_DIR=/opt/spectech/shared/uploads
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
ENV
  chmod 600 "$base/shared/app.env"
fi
set -a
source "$base/shared/app.env"
set +a
mkdir -p "$dir"
tar -xzf "$base/incoming.tar.gz" -C "$dir"
cd "$dir"
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npx prisma generate --config prisma7.config.ts
runuser -u postgres -- pg_dump -Fc spectech > "$base/backups/before-$release.dump"
npx prisma migrate deploy --config prisma7.config.ts
chown -R spectech:spectech "$dir"
chmod 755 "$base" "$base/releases"
previous=$(readlink -f "$base/current" || true)
ln -sfn "$dir" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
cp deploy/spectech.service /etc/systemd/system/spectech.service
systemctl daemon-reload
systemctl enable spectech
systemctl restart spectech
ok=false
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/services >/dev/null; then ok=true; break; fi
  sleep 2
done
if [[ "$ok" != true ]]; then
  if [[ -n "$previous" && "$previous" != "$dir" ]]; then
    ln -sfn "$previous" "$base/current"
    systemctl restart spectech
  fi
  journalctl -u spectech -n 40 --no-pager
  exit 1
fi
# Preserve certbot-managed HTTPS configuration on subsequent releases.
if [[ ! -f /etc/nginx/sites-available/spectech ]]; then
  cp deploy/nginx.conf /etc/nginx/sites-available/spectech
  ln -s /etc/nginx/sites-available/spectech /etc/nginx/sites-enabled/spectech
fi
nginx -t
systemctl enable --now nginx
systemctl reload nginx
if [[ ! -f /etc/letsencrypt/live/specteh.online/fullchain.pem ]]; then
  certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email --redirect -d specteh.online
fi
curl --fail --retry 5 --retry-delay 2 https://specteh.online/api/services >/dev/null
rm -f "$base/incoming.tar.gz"
echo "Release $release ready: https://specteh.online"