#!/bin/sh
set -e

# Bypass corporate proxy self-signed cert for Prisma binary downloads
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "==> Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "==> Seeding database..."
node dist/prisma/seed.js 2>/dev/null || true

# Restore strict TLS before starting the app
unset NODE_TLS_REJECT_UNAUTHORIZED

echo "==> Starting POS API on port 3000"
exec node dist/src/main