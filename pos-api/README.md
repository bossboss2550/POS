# POS API — NestJS Backend

REST API for the POS React frontend. Built with **NestJS 11 + Prisma 6 + PostgreSQL**.

## Stack
- **Framework:** NestJS 11 (TypeScript)
- **ORM:** Prisma 6
- **Database:** PostgreSQL (swap `provider` to `sqlite` for zero-setup local dev)
- **Auth:** JWT (15m access token) + Refresh token rotation (7d, stored in DB)
- **Validation:** class-validator + class-transformer
- **Rate limiting:** @nestjs/throttler (100 req/min)

## Quick Start

```bash
# 1. Copy env
cp .env.example .env
# Edit DATABASE_URL and JWT secrets

# 2. Install
npm install

# 3. Run DB migrations
npx prisma migrate dev --name init

# 4. Seed demo data
npm run seed

# 5. Start dev server
npm run start:dev
# API available at http://localhost:3000/api/v1
```

## API Routes

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | /api/v1/auth/login | — | — |
| POST | /api/v1/auth/refresh | — | — |
| POST | /api/v1/auth/logout | JWT | any |
| GET  | /api/v1/auth/me | JWT | any |
| GET  | /api/v1/products | JWT | any |
| POST | /api/v1/products | JWT | ADMIN/MANAGER |
| PATCH | /api/v1/products/:id | JWT | ADMIN/MANAGER |
| DELETE | /api/v1/products/:id | JWT | ADMIN |
| GET  | /api/v1/products/barcode/:barcode | JWT | any |
| GET  | /api/v1/orders | JWT | any |
| POST | /api/v1/orders | JWT | any |
| PATCH | /api/v1/orders/:id/void | JWT | ADMIN/MANAGER |
| GET  | /api/v1/customers | JWT | any |
| POST | /api/v1/customers | JWT | any |
| GET  | /api/v1/inventory | JWT | any |
| POST | /api/v1/inventory/:productId/adjust | JWT | ADMIN/MANAGER |
| GET  | /api/v1/reports/dashboard | JWT | ADMIN/MANAGER |
| GET  | /api/v1/reports/sales | JWT | ADMIN/MANAGER |
| GET  | /api/v1/settings | JWT | any |
| PATCH | /api/v1/settings | JWT | ADMIN |
| GET  | /api/v1/users | JWT | ADMIN |
| POST | /api/v1/users | JWT | ADMIN |

## Response Envelope

All responses are wrapped:
```json
{ "success": true, "data": { ... } }
{ "success": false, "statusCode": 404, "message": "Not found" }
```

## Connect Frontend

In `pos-app/.env`:
```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Demo Credentials (after seed)
- admin@pos.com / password
- cashier@pos.com / password
