# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept proxy build args (for corporate environments)
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY

COPY package*.json ./
RUN npm ci

COPY . .

# NODE_TLS_REJECT_UNAUTHORIZED=0 bypasses corporate proxy self-signed cert
# during build only — NOT inherited by the production stage.
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app — output is dist/src/main.js + dist/prisma/seed.js
# (rootDir shifts to project root because prisma/seed.ts is included in tsconfig.build.json)
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema (needed for prisma db push at startup)
COPY prisma ./prisma

# Copy and chmod entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
