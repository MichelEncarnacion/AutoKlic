#!/usr/bin/env bash
# Assembles deploy/package/ ready to zip and upload to cPanel public_html (+ notes).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy/package"
SITE_URL="${VITE_SITE_URL:-https://autoclik.michel-encarnacion.dev}"

cd "$ROOT"
if [[ ! -f .env ]]; then
  cp .env.example .env
fi
export VITE_SITE_URL="$SITE_URL"
export VITE_API_BASE="${VITE_API_BASE:-/api}"
npm ci
npm run build

rm -rf "$OUT"
mkdir -p "$OUT/public_html/api" "$OUT/public_html/uploads/car-images" "$OUT/public_html/uploads/compra-docs" "$OUT/sql" "$OUT/config-outside-webroot"

# Frontend build
cp -a dist/. "$OUT/public_html/"

# PHP API
cp -a api/. "$OUT/public_html/api/"

# SQL + config template
cp sql/schema.sql sql/seed-admin.sql "$OUT/sql/"
cp config/config.example.php "$OUT/config-outside-webroot/autoklic-config.php"
cp deploy/CPANEL-UPLOAD.md "$OUT/README-UPLOAD.md"

# Placeholders so empty dirs survive zip + harden uploads (copied from public/)
cp -f public/uploads/.htaccess "$OUT/public_html/uploads/.htaccess"
cp -f public/uploads/compra-docs/.htaccess "$OUT/public_html/uploads/compra-docs/.htaccess"
touch "$OUT/public_html/uploads/car-images/.gitkeep"
touch "$OUT/public_html/uploads/compra-docs/.gitkeep"

cat > "$OUT/UPLOAD-ORDER.txt" << EOF
Production: https://autoclik.michel-encarnacion.dev
DOCROOT = cPanel document root for subdomain autoclik (not necessarily apex public_html)

1. Edit config-outside-webroot/autoklic-config.php (DB + jwt + uploads_path = DOCROOT/uploads)
2. Upload that file to /home/CPANEL_USER/autoklic-config.php (OUTSIDE DOCROOT)
3. Import sql/schema.sql then sql/seed-admin.sql in phpMyAdmin
   (generate bcrypt hash yourself — never put plaintext passwords in the repo)
4. Upload CONTENTS of public_html/ into the subdomain DOCROOT
5. Login with the password YOU generated → change it in Perfil
See README-UPLOAD.md for full checklist.
EOF

echo "Package ready: $OUT"
echo "Zip with: (cd deploy && zip -r autoklic-cpanel.zip package)"
