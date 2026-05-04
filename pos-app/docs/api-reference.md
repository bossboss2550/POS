# POS System — API Reference

> **Base URL:** `http://localhost:8000/api/v1`  
> Set `VITE_API_BASE_URL` in your `.env` file to override.

## Authentication

All endpoints except `/auth/login` require:
```
Authorization: Bearer <access_token>
```

Tokens expire after **1 hour**. Use `/auth/refresh` to get a new token silently.

---

## Global Response Envelopes

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated list
```json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## HTTP Status Codes Used

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE) |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing / expired token |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — duplicate barcode / email |
| 422 | Unprocessable Entity — business rule violation |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 1. Authentication

### POST `/auth/login`
Authenticate user and receive access + refresh tokens.

**Request**
```json
{
  "email": "admin@pos.com",
  "password": "password"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u1",
      "name": "Admin User",
      "email": "admin@pos.com",
      "role": "admin",
      "branchId": "branch-1",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZn..."
  }
}
```

**Roles:** `admin` | `manager` | `cashier`

---

### POST `/auth/refresh`
Silently renew the access token using a refresh token.

**Request**
```json
{ "refreshToken": "dGhpcyBpcyBhIHJlZn..." }
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "newRefreshToken..."
  }
}
```

---

### POST `/auth/logout`
Invalidate the refresh token server-side.

**Response `204`** (no body)

---

### GET `/auth/me`
Return the authenticated user's profile.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "u1",
    "name": "Admin User",
    "email": "admin@pos.com",
    "role": "admin",
    "branchId": "branch-1",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 2. Products

### GET `/products`
List products with optional filtering and pagination.

**Query Params**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page (max 200) |
| `search` | string | — | Search by name or barcode |
| `categoryId` | string | — | Filter by category |
| `isActive` | boolean | — | Filter active/inactive |

**Response `200`** — paginated list of `Product`

---

### GET `/products/:id`
Get a single product by ID.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "name": "Premium Coffee Beans",
    "barcode": "8850999123456",
    "categoryId": "cat-1",
    "price": 450.00,
    "cost": 280.00,
    "stock": 48,
    "minStock": 10,
    "unit": "pack",
    "description": "Single-origin Arabica beans",
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-03-10T14:30:00Z"
  }
}
```

---

### GET `/products/barcode/:barcode`
Look up a product by its barcode (used by scanner).

**Response `200`** — single `Product` (same shape as above)  
**Response `404`** — if barcode not found

---

### POST `/products`
Create a new product. Requires role: `admin` or `manager`.

**Request**
```json
{
  "name": "New Product",
  "barcode": "8850999999999",
  "categoryId": "cat-2",
  "price": 199.00,
  "cost": 120.00,
  "stock": 50,
  "minStock": 5,
  "unit": "piece",
  "description": "Optional description",
  "isActive": true
}
```

**Response `201`** — created `Product`

---

### PATCH `/products/:id`
Partially update a product. Requires role: `admin` or `manager`.

**Request** — any subset of product fields
```json
{
  "price": 220.00,
  "isActive": false
}
```

**Response `200`** — updated `Product`

---

### DELETE `/products/:id`
Soft-delete a product (sets `isActive = false`). Requires role: `admin`.

**Response `204`** (no body)

---

### GET `/products/categories`
List all product categories.

**Response `200`**
```json
{
  "success": true,
  "data": [
    { "id": "cat-1", "name": "Beverages", "color": "#3b82f6", "icon": "coffee" },
    { "id": "cat-2", "name": "Snacks",    "color": "#10b981", "icon": "package" }
  ]
}
```

---

## 3. Orders

### GET `/orders`
List orders with filtering and pagination.

**Query Params**
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `search` | string | Search by order number or customer name |
| `status` | string | `pending` \| `paid` \| `cancelled` \| `refunded` |
| `dateFrom` | ISO 8601 | Filter orders from this date |
| `dateTo` | ISO 8601 | Filter orders up to this date |

**Response `200`** — paginated list of `Order`

---

### GET `/orders/:id`
Get a single order with full details.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "ord-001",
    "orderNumber": "ORD-20240115-001",
    "items": [
      {
        "productId": "p1",
        "productName": "Premium Coffee Beans",
        "barcode": "8850999123456",
        "quantity": 2,
        "unitPrice": 450.00,
        "discount": 0,
        "total": 900.00
      }
    ],
    "customerId": "cust-1",
    "customerName": "John Smith",
    "cashierId": "u2",
    "cashierName": "Jane Cashier",
    "subtotal": 900.00,
    "discountAmount": 0.00,
    "taxAmount": 63.00,
    "total": 963.00,
    "payment": {
      "id": "pay-001",
      "orderId": "ord-001",
      "splits": [{ "method": "cash", "amount": 1000.00 }],
      "total": 963.00,
      "change": 37.00,
      "createdAt": "2024-01-15T10:05:00Z"
    },
    "status": "paid",
    "note": "",
    "createdAt": "2024-01-15T10:05:00Z",
    "updatedAt": "2024-01-15T10:05:00Z"
  }
}
```

---

### POST `/orders`
Create a new order (checkout). The server calculates `orderNumber`, decrements stock, and processes payment.

**Request**
```json
{
  "items": [
    {
      "productId": "p1",
      "productName": "Premium Coffee Beans",
      "barcode": "8850999123456",
      "quantity": 2,
      "unitPrice": 450.00,
      "discount": 0,
      "total": 900.00
    }
  ],
  "customerId": "cust-1",
  "customerName": "John Smith",
  "cashierId": "u2",
  "cashierName": "Jane Cashier",
  "subtotal": 900.00,
  "discountAmount": 0.00,
  "taxAmount": 63.00,
  "total": 963.00,
  "payment": {
    "splits": [{ "method": "cash", "amount": 1000.00 }],
    "total": 963.00,
    "change": 37.00
  },
  "status": "paid",
  "note": ""
}
```

**Response `201`** — created `Order`

---

### PATCH `/orders/:id/status`
Update order status. Requires role: `admin` or `manager`.

**Request**
```json
{ "status": "refunded" }
```

**Response `200`** — updated `Order`

---

## 4. Customers

### GET `/customers`
List customers with pagination and search.

**Query Params:** `page`, `pageSize`, `search` (name or phone)

**Response `200`** — paginated list of `Customer`

---

### GET `/customers/:id`
Get customer details including purchase history summary.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "cust-1",
    "name": "John Smith",
    "phone": "081-234-5678",
    "email": "john@example.com",
    "address": "123 Main St",
    "loyaltyPoints": 480,
    "totalSpent": 14800.00,
    "memberTier": "silver",
    "createdAt": "2024-01-10T00:00:00Z"
  }
}
```

**Member tiers:** `bronze` | `silver` | `gold` | `platinum`

---

### POST `/customers`
Create a new customer.

**Request**
```json
{
  "name": "Jane Doe",
  "phone": "082-987-6543",
  "email": "jane@example.com",
  "address": "456 Oak Ave"
}
```

**Response `201`** — created `Customer` (with `loyaltyPoints: 0`, `totalSpent: 0`, `memberTier: "bronze"`)

---

### PATCH `/customers/:id`
Update customer info. Requires role: `admin` or `manager`.

**Request** — any subset of editable customer fields  
**Response `200`** — updated `Customer`

---

## 5. Inventory

### GET `/inventory/movements`
List stock movement history.

**Query Params**
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `productId` | string | Filter by product |

**Response `200`** — paginated list of `StockMovement`

```json
{
  "success": true,
  "data": [
    {
      "id": "mv-001",
      "productId": "p1",
      "productName": "Premium Coffee Beans",
      "type": "in",
      "quantity": 50,
      "beforeStock": 10,
      "afterStock": 60,
      "reason": "Restocked from supplier",
      "userId": "u1",
      "createdAt": "2024-03-10T09:00:00Z"
    }
  ]
}
```

**Movement types:** `in` | `out` | `adjustment` | `transfer`

---

### POST `/inventory/adjust`
Adjust stock for a product. Requires role: `admin` or `manager`.

**Request**
```json
{
  "productId": "p1",
  "quantity": 50,
  "type": "in",
  "reason": "Restocked from supplier"
}
```

> For `out` or `adjustment`, `quantity` can be negative or positive (server calculates `beforeStock` / `afterStock`).

**Response `201`** — created `StockMovement`

---

### GET `/inventory/low-stock`
Get all products at or below their minimum stock level.

**Response `200`** — array of `Product` objects (same shape as `/products/:id`)

---

## 6. Reports & Dashboard

### GET `/reports/dashboard`
Aggregated dashboard data for the current day/period.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "todaySales": 24850.00,
    "todayOrders": 47,
    "lowStockCount": 3,
    "activeCustomers": 128,
    "salesTrend": [
      {
        "date": "2024-03-04",
        "totalSales": 18200.00,
        "totalOrders": 34,
        "totalItems": 89,
        "avgOrderValue": 535.29
      }
    ],
    "topProducts": [
      {
        "productId": "p1",
        "productName": "Premium Coffee Beans",
        "quantitySold": 42,
        "revenue": 18900.00
      }
    ],
    "recentOrders": [ "...last 5 orders..." ]
  }
}
```

---

## 7. Settings (Optional Endpoint)

> The current frontend stores settings in `localStorage` via Zustand. If you want server-backed settings, implement these:

### GET `/settings`
Get store settings for the authenticated branch.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "storeName": "My POS Store",
    "address": "123 High Street",
    "phone": "02-123-4567",
    "taxRate": 0.07,
    "currency": "THB",
    "currencySymbol": "฿",
    "receiptFooter": "Thank you for your purchase!",
    "logoUrl": "https://cdn.example.com/logo.png"
  }
}
```

### PATCH `/settings`
Update store settings. Requires role: `admin`.

**Request** — any subset of settings fields  
**Response `200`** — updated settings object

---

## Data Models Reference

### User
```typescript
{
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "cashier";
  branchId: string;
  createdAt: string; // ISO 8601
}
```

### Product
```typescript
{
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  price: number;       // selling price
  cost: number;        // purchase cost
  stock: number;       // current quantity
  minStock: number;    // low-stock threshold
  unit: string;        // e.g. "piece", "pack", "kg"
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Order
```typescript
{
  id: string;
  orderNumber: string;     // e.g. "ORD-20240315-001"
  items: OrderItem[];
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  payment: Payment;
  status: "pending" | "paid" | "cancelled" | "refunded";
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Customer
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  memberTier: "bronze" | "silver" | "gold" | "platinum";
  createdAt: string;
}
```

### StockMovement
```typescript
{
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  beforeStock: number;
  afterStock: number;
  reason: string;
  userId: string;
  createdAt: string;
}
```

---

## Environment Variables

| Variable | Required | Example | Description |
|---|---|---|---|
| `VITE_USE_MOCK` | No | `true` | `true` = mock data, `false` = real API |
| `VITE_API_BASE_URL` | Yes (prod) | `https://api.yourpos.com/api/v1` | Backend API base URL |

### `.env.development`
```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### `.env.production`
```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=https://api.yourpos.com/api/v1
```

---

## Quick Checklist for Backend Developer

- [ ] All responses wrapped in `{ success, data }` envelope
- [ ] Paginated responses include `total`, `page`, `pageSize`, `totalPages`
- [ ] `Authorization: Bearer <token>` enforced on all routes except `/auth/login`
- [ ] `POST /auth/refresh` accepts `refreshToken` and returns new pair
- [ ] `GET /products/barcode/:barcode` returns `404` (not `200` with null) when not found
- [ ] `POST /orders` atomically decrements stock and creates payment record
- [ ] `PATCH /orders/:id/status` validates allowed status transitions
- [ ] Soft-delete products (never hard-delete — orders reference them)
- [ ] Timestamps in ISO 8601 UTC format (`2024-03-15T10:30:00Z`)
- [ ] CORS enabled for frontend origin
- [ ] `branchId` scoping — users only see data for their branch
