#!/usr/bin/env bash

set -Eeuo pipefail

# Run from a temporary copy so this script can safely update its own repository.
if [[ "${HHH_DEPLOY_REEXEC:-0}" != "1" ]]; then
  deploy_temp="$(mktemp /tmp/hhh-jobs-deploy.XXXXXX)"
  cp "$0" "$deploy_temp"
  chmod 700 "$deploy_temp"
  HHH_DEPLOY_REEXEC=1 HHH_DEPLOY_TEMP="$deploy_temp" exec bash "$deploy_temp" "$@"
fi

cleanup() {
  status=$?
  rm -f "${HHH_DEPLOY_TEMP:-}"
  if (( status != 0 )); then
    printf '\nHHH Jobs deployment failed (exit %s). Review the last error above.\n' "$status" >&2
  fi
  exit "$status"
}
trap cleanup EXIT

BACKEND_DIR="${BACKEND_DIR:-/opt/hhh-jobs/backend}"
FRONTEND_DIR="${FRONTEND_DIR:-/opt/hhh-jobs/frontend-src}"
WEB_ROOT="${WEB_ROOT:-/var/www/hhh-jobs}"
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://127.0.0.1:6007}"
BACKEND_SERVICE="${BACKEND_SERVICE:-hhh-jobs-backend}"
BACKEND_WAIT_SECONDS="${BACKEND_WAIT_SECONDS:-300}"
SKIP_BACKEND_UPDATE="${SKIP_BACKEND_UPDATE:-0}"
NGINX_SITE_LINK="${NGINX_SITE_LINK:-/etc/nginx/sites-enabled/hhh-jobs-frontend}"
SITEMAP_INCLUDE="/etc/nginx/snippets/hhh-jobs-sitemap-server.conf"
PERFORMANCE_CONFIG="/etc/nginx/conf.d/20-hhh-jobs-performance.conf"

log() {
  printf '\n==> %s\n' "$1"
}

if (( EUID != 0 )); then
  echo "Run this deployment script as root." >&2
  exit 1
fi

for required_command in git npm systemctl curl nginx install grep sed; do
  command -v "$required_command" >/dev/null 2>&1 || {
    echo "Missing required command: $required_command" >&2
    exit 1
  }
done

[[ -d "$BACKEND_DIR/.git" ]] || {
  echo "Backend repository not found at $BACKEND_DIR" >&2
  exit 1
}
[[ -d "$FRONTEND_DIR/.git" ]] || {
  echo "Frontend repository not found at $FRONTEND_DIR" >&2
  exit 1
}
[[ "$BACKEND_WAIT_SECONDS" =~ ^[1-9][0-9]*$ ]] || {
  echo "BACKEND_WAIT_SECONDS must be a positive integer." >&2
  exit 1
}

if [[ "$SKIP_BACKEND_UPDATE" == "1" ]]; then
  log "Keeping the currently running backend"
else
  log "Updating backend"
  cd "$BACKEND_DIR"
  git pull --ff-only origin main
  npm ci --omit=dev
  npm run ensure:mysql-schema
  systemctl restart "$BACKEND_SERVICE"
fi

log "Waiting for backend readiness"
backend_ready=0
for ((attempt = 1; attempt <= BACKEND_WAIT_SECONDS; attempt += 1)); do
  if curl -fs --max-time 3 "$BACKEND_ORIGIN/health" >/dev/null 2>&1; then
    backend_ready=1
    printf 'Backend ready after %s second(s).\n' "$attempt"
    break
  fi
  if (( attempt % 10 == 0 )); then
    printf 'Still waiting for backend (%s/%s seconds)...\n' \
      "$attempt" "$BACKEND_WAIT_SECONDS"
  fi
  sleep 1
done

if (( backend_ready == 0 )); then
  systemctl status "$BACKEND_SERVICE" --no-pager -l || true
  journalctl -u "$BACKEND_SERVICE" -n 100 --no-pager || true
  echo "Backend did not become ready within $BACKEND_WAIT_SECONDS seconds." >&2
  exit 1
fi

backend_index="$(mktemp)"
curl -fsS --max-time 90 "$BACKEND_ORIGIN/sitemap.xml?refresh=1" -o "$backend_index"
grep -q '<sitemapindex' "$backend_index" || {
  head -30 "$backend_index" >&2
  echo "Backend did not return a sitemap index." >&2
  exit 1
}
rm -f "$backend_index"

log "Updating and building frontend"
cd "$FRONTEND_DIR"

# A legacy static sitemap conflicts with the dynamic sitemap and may also block git pull.
if git ls-files --error-unmatch public/sitemap.xml >/dev/null 2>&1; then
  if ! git diff --quiet -- public/sitemap.xml || ! git diff --cached --quiet -- public/sitemap.xml; then
    echo "Restoring legacy public/sitemap.xml before pulling current code."
    git restore --source=HEAD --staged --worktree -- public/sitemap.xml
  fi
else
  rm -f public/sitemap.xml
fi

git pull --ff-only origin main
npm ci
npm run build
test -s dist/index.html

log "Publishing frontend assets"
install -d -m 0755 "$WEB_ROOT"
cp -a dist/. "$WEB_ROOT/"
rm -f "$WEB_ROOT/sitemap.xml"

log "Installing dynamic sitemap route in Nginx"
install -d -m 0755 /etc/nginx/snippets
install -m 0644 \
  "$FRONTEND_DIR/deploy/nginx/hhh-jobs-sitemap-server.conf" \
  "$SITEMAP_INCLUDE"

log "Installing static compression and cache policy"
install -m 0644 \
  "$FRONTEND_DIR/deploy/nginx/hhh-jobs-compression.conf" \
  "$PERFORMANCE_CONFIG"

if ! nginx -T 2>&1 | grep -Eq '^[[:space:]]*gzip[[:space:]]+on;'; then
  printf 'gzip on;\n' > /etc/nginx/conf.d/00-hhh-jobs-gzip-on.conf
fi

site_config="$(readlink -f "$NGINX_SITE_LINK")"
[[ -n "$site_config" && -f "$site_config" ]] || {
  echo "Nginx site config not found through $NGINX_SITE_LINK" >&2
  exit 1
}

install -d -m 0700 /root/nginx-backups
cp -a "$site_config" \
  "/root/nginx-backups/hhh-jobs-frontend.$(date +%Y%m%d-%H%M%S)"

# Reinsert deterministically so both HTTP and HTTPS HHH Jobs server blocks are covered.
sed -i \
  "\\|^[[:space:]]*include $SITEMAP_INCLUDE;[[:space:]]*$|d" \
  "$site_config"
sed -i \
  "/^[[:space:]]*server_name[[:space:]].*hhh-jobs\\.com/ a\\
    include $SITEMAP_INCLUDE;" \
  "$site_config"

grep -qF "include $SITEMAP_INCLUDE;" "$site_config" || {
  echo "Could not attach the sitemap include to $site_config" >&2
  exit 1
}

nginx -t
systemctl reload nginx

log "Validating public sitemap index and first child"
index_file="$(mktemp)"
child_file="$(mktemp)"
headers_file="$(mktemp)"
cache_buster="$(date +%s)"

curl -fsS --retry 10 --retry-delay 1 --retry-connrefused --max-time 90 \
  -D "$headers_file" \
  "https://hhh-jobs.com/sitemap.xml?refresh=1&v=$cache_buster" \
  -o "$index_file"

grep -q '<sitemapindex' "$index_file" || {
  head -30 "$index_file" >&2
  echo "Public /sitemap.xml is not the dynamic sitemap index." >&2
  exit 1
}

first_child="$(sed -n 's:.*<loc>\(.*\)</loc>.*:\1:p' "$index_file" \
  | head -1 | sed 's/&amp;/\&/g')"
[[ -n "$first_child" ]] || {
  echo "No child sitemap URL found in the sitemap index." >&2
  exit 1
}

curl -fsS --retry 5 --retry-delay 1 --max-time 90 \
  "$first_child" -o "$child_file"
grep -q '<urlset' "$child_file" || {
  head -30 "$child_file" >&2
  echo "First child sitemap is invalid." >&2
  exit 1
}

asset_path="$(find "$WEB_ROOT/assets" -maxdepth 1 -type f -name '*.js' -printf '%f\n' | head -1)"
[[ -n "$asset_path" ]] || {
  echo "No built JavaScript asset found for compression validation." >&2
  exit 1
}

asset_headers="$(curl -fsSI -H 'Accept-Encoding: gzip' "https://hhh-jobs.com/assets/$asset_path")"
grep -qi '^content-encoding: gzip' <<< "$asset_headers" || {
  printf '%s\n' "$asset_headers" >&2
  echo "Static JavaScript is not being served with gzip compression." >&2
  exit 1
}
grep -qi 'cache-control:.*immutable' <<< "$asset_headers" || {
  printf '%s\n' "$asset_headers" >&2
  echo "Fingerprint asset cache policy is missing immutable caching." >&2
  exit 1
}

printf '\nDeployment complete.\n'
printf 'Sitemap index: https://hhh-jobs.com/sitemap.xml\n'
printf 'Sitemap chunks: %s\n' "$(grep -c '<sitemap>' "$index_file")"
printf 'First child: %s\n' "$first_child"
printf 'First child URLs: %s\n' "$(grep -c '<url>' "$child_file")"
printf 'Static assets: gzip + immutable cache verified\n'
grep -Ei '^(content-type|cache-control|x-hhh-sitemap):' "$headers_file" || true

rm -f "$index_file" "$child_file" "$headers_file"
