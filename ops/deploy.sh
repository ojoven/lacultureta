#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
server="${1:-agent}"
release="$(date -u +%Y%m%dT%H%M%SZ)"
if [ "${2:-}" != '--prepared' ]; then node ops/package.mjs; fi
scp web/lacultureta-release.tgz "$server:/tmp/lacultureta-release-$release.tgz"
scp ops/lacultureta*service ops/lacultureta*timer "$server:/tmp/"
scp ops/Caddyfile "$server:/tmp/lacultureta-Caddyfile"
scp ops/requirements-scraper.txt "$server:/tmp/lacultureta-requirements-scraper.txt"
ssh "$server" bash -s -- "$release" <<'REMOTE'
set -euo pipefail
release="$1"
base=/opt/lacultureta
sudo -n mkdir -p "$base/releases/$release" /var/lib/lacultureta /var/backups/lacultureta
if ! id lacultureta >/dev/null 2>&1; then sudo -n useradd --system --home /var/lib/lacultureta --shell /usr/sbin/nologin lacultureta; fi
sudo -n tar -xzf "/tmp/lacultureta-release-$release.tgz" -C "$base/releases/$release"
# Install the native module for the server's Node ABI. No full production npm install is needed.
version="$(cat "$base/releases/$release/sqlite-version")"
sudo -n mkdir -p "$base/native" "$base/runtime/bin"
if ! cmp -s /home/ubuntu/.local/bin/node "$base/runtime/bin/node"; then
  sudo -n install -m 755 /home/ubuntu/.local/bin/node "$base/runtime/bin/node.next"
  sudo -n mv -f "$base/runtime/bin/node.next" "$base/runtime/bin/node"
fi
sudo -n chown -R ubuntu:ubuntu "$base/native"
PATH=/home/ubuntu/.hermes/node/bin:/usr/bin:/bin /home/ubuntu/.hermes/node/bin/npm install --prefix "$base/native" --no-audit --no-fund "better-sqlite3@$version"
if [ ! -x "$base/scraper-venv/bin/python" ]; then
  sudo -n apt-get install -y python3-venv
  sudo -n python3 -m venv "$base/scraper-venv"
fi
sudo -n "$base/scraper-venv/bin/pip" --disable-pip-version-check -q install -r /tmp/lacultureta-requirements-scraper.txt
sudo -n cp "$base/native/node_modules/better-sqlite3/build/Release/better_sqlite3.node" "$base/releases/$release/node_modules/better-sqlite3/build/Release/better_sqlite3.node"
sudo -n "$base/runtime/bin/node" "$base/releases/$release/setup-push.cjs"
sudo -n chown -R lacultureta:lacultureta /var/lib/lacultureta /var/backups/lacultureta
sudo -n chmod 750 /var/lib/lacultureta /var/backups/lacultureta
sudo -n cp /tmp/lacultureta*.service /tmp/lacultureta*.timer /etc/systemd/system/
previous="$(readlink -f "$base/current" || true)"
sudo -n ln -sfn "$base/releases/$release" "$base/current"
sudo -n systemctl daemon-reload
if ! sudo -n systemctl start lacultureta-scrape.service; then
  if [ -n "$previous" ] && [ -f "$previous/server.js" ]; then sudo -n ln -sfn "$previous" "$base/current"; fi
  sudo -n journalctl -u lacultureta-scrape -n 20 --no-pager
  exit 1
fi
sudo -n systemctl enable lacultureta.service lacultureta-scrape.timer lacultureta-backup.timer lacultureta-notify.timer
sudo -n systemctl restart lacultureta.service
sudo -n systemctl start lacultureta-scrape.timer lacultureta-backup.timer lacultureta-notify.timer
healthy=false
for attempt in $(seq 1 20); do
  if curl --fail --silent http://127.0.0.1:3100/api/health; then healthy=true; break; fi
  sleep 1
done
if [ "$healthy" != true ]; then
  if [ -n "$previous" ] && [ -f "$previous/server.js" ]; then
    sudo -n ln -sfn "$previous" "$base/current"
    sudo -n systemctl restart lacultureta.service
  fi
  sudo -n journalctl -u lacultureta -n 35 --no-pager
  exit 1
fi
sudo -n systemctl start lacultureta-backup.service
sudo -n caddy validate --config /tmp/lacultureta-Caddyfile --adapter caddyfile
sudo -n cp /tmp/lacultureta-Caddyfile /etc/caddy/Caddyfile
sudo -n systemctl reload caddy
rm -f "/tmp/lacultureta-release-$release.tgz"
echo "Deployed release $release"
REMOTE
