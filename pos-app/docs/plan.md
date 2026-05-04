# 🏪 POS (Point of Sale) React 19.2 Project Plan

## Problem Statement
Build a modern, full-featured POS system using React 19.2 + TypeScript.
- Barcode scanner support (USB HID & camera-based)
- Mock data layer that can be swapped to real API with zero code changes
- Production-ready service architecture

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19.2 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 4 + Shadcn/ui |
| State | Zustand (global) + React Context (auth/theme) |
| Forms | React Hook Form + Zod validation |
| API Layer | Axios + TanStack Query v5 (react-query) |
| Barcode Camera | html5-qrcode / ZXing |
| Barcode USB | Native keyboard input listener (HID emulation) |
| Date/Time | dayjs |
| Receipt Print | react-to-print |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |
| Icons | Lucide React |

---

## Project Structure

```
pos-app/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/               # Shadcn base components
│   │   ├── layout/           # Sidebar, Header, MainLayout
│   │   ├── pos/              # POS-specific components
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── shared/
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service layer (mock + real)
│   │   ├── mock/             # Mock data & mock API handlers
│   │   └── api/              # Real API adapters
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript interfaces/types
│   ├── utils/                # Helpers, formatters
│   ├── lib/                  # Config (axios, query client)
│   └── pages/                # Route-level pages
```

---

## 📋 Features List

### 🟢 BASIC Features

#### 1. Product Management
- [ ] Product list with search & filter
- [ ] Add / Edit / Delete product
- [ ] Product categories
- [ ] Product image upload
- [ ] Barcode field per product

#### 2. POS Terminal (Cashier Screen)
- [ ] Product search by name / barcode scan
- [ ] Add items to cart
- [ ] Adjust quantity in cart
- [ ] Remove item from cart
- [ ] Apply discount per item or total
- [ ] Calculate subtotal / tax / total
- [ ] Select customer (optional)
- [ ] Process payment (cash / card)
- [ ] Print / export receipt

#### 3. Order Management
- [ ] Order list (all orders)
- [ ] Order detail view
- [ ] Order status (pending, paid, cancelled)
- [ ] Void / refund order

#### 4. Customer Management
- [ ] Customer list
- [ ] Add / Edit customer
- [ ] Customer purchase history

#### 5. Inventory
- [ ] Stock level per product
- [ ] Low stock alert
- [ ] Stock adjustment (add / subtract)

#### 6. Authentication
- [ ] Login / Logout
- [ ] Role-based access: Admin, Cashier, Manager

#### 7. Dashboard
- [ ] Today's sales summary
- [ ] Top selling products
- [ ] Recent orders table

---

### 🔵 EXPERT / ADVANCED Features

#### 8. Barcode Scanner Integration
- [ ] USB/Bluetooth HID barcode scanner (keyboard emulation listener)
- [ ] Camera-based QR/barcode scan via `html5-qrcode`
- [ ] Auto-focus scanner mode (listen continuously on POS screen)
- [ ] Manual barcode input fallback

#### 9. Advanced Payment
- [ ] Split payment (cash + card)
- [ ] Multi-currency with exchange rates
- [ ] Payment method history tracking

#### 10. Smart Cart
- [ ] Saved carts / drafts (multiple open transactions)
- [ ] Hold & recall cart
- [ ] `useOptimistic` for instant cart feedback

#### 11. Promotions & Discounts
- [ ] Coupon codes
- [ ] Buy X Get Y promotions
- [ ] Member discount tiers

#### 12. Reports & Analytics
- [ ] Daily / weekly / monthly sales charts (Recharts)
- [ ] Revenue by category
- [ ] Staff performance report
- [ ] Export to CSV / PDF

#### 13. Inventory Advanced
- [ ] Purchase orders to suppliers
- [ ] Stock transfer between branches
- [ ] Expiry date tracking

#### 14. Offline Support
- [ ] IndexedDB cache for products
- [ ] Queue orders when offline, sync on reconnect

#### 15. Multi-Branch / Multi-Terminal
- [ ] Branch management
- [ ] Terminal assignment

#### 16. Thermal Printer Support
- [ ] ESC/POS commands
- [ ] Receipt template builder

---

## 🔧 Service Layer Architecture

### API Adapter Pattern (Mock → Real swap)

```
src/services/
├── index.ts             # Exports service based on env flag
├── types.ts             # Shared service interfaces (contracts)
├── mock/
│   ├── mockData.ts      # All mock data (products, orders, etc.)
│   ├── productService.ts
│   ├── orderService.ts
│   ├── customerService.ts
│   ├── inventoryService.ts
│   ├── authService.ts
│   └── reportService.ts
└── api/
    ├── productService.ts
    ├── orderService.ts
    ├── customerService.ts
    ├── inventoryService.ts
    ├── authService.ts
    └── reportService.ts
```

Switch via `.env`:
```
VITE_USE_MOCK=true   # use mock services
VITE_USE_MOCK=true  # use real API services
```

---

## 🪝 Custom Hooks List

| Hook | Purpose |
|---|---|
| `useBarcodeScanner` | Listen for USB HID scanner input |
| `useCameraScanner` | Camera-based QR/barcode scan |
| `useCart` | Cart state management |
| `usePayment` | Handle payment flow |
| `useProducts` | Product CRUD with TanStack Query |
| `useOrders` | Order CRUD with TanStack Query |
| `useCustomers` | Customer CRUD |
| `useInventory` | Stock management |
| `useReports` | Analytics data fetching |
| `useAuth` | Auth state & permissions |
| `usePrint` | Receipt printing |
| `useOfflineSync` | IndexedDB + sync queue |

---

## 🗂️ Zustand Stores

| Store | Responsibility |
|---|---|
| `cartStore` | Active cart items, totals, discounts |
| `settingsStore` | Tax rate, currency, store info |
| `authStore` | Current user, role, token |
| `uiStore` | Sidebar open, modals, notifications |
| `offlineStore` | Queued offline transactions |

---

## 📦 Mock Data Entities

- Products (50+ items with barcodes, categories, prices, stock)
- Categories (10 categories)
- Customers (30 customers)
- Orders (100 historical orders)
- Users (5 staff with different roles)
- Inventory snapshots

---

## Implementation Phases

### ✅ Phase 1 — Foundation (COMPLETE)
- [x] Project scaffold (Vite + React 19.2 + TS + Tailwind v4)
- [x] Service layer with mock data (25 products, 8 customers, 80 orders, 5 users)
- [x] Auth (login/logout, role guard, Zustand authStore)
- [x] Layout (Sidebar, Header, MainLayout, Notifications toast)
- [x] Dashboard page (stat cards, 7-day chart, top products, recent orders)
- [x] POS Terminal (product grid, cart, barcode scanner hook, basic checkout)
- [x] Zustand stores: authStore, cartStore, settingsStore, uiStore
- [x] Custom hooks: useBarcodeScanner, useNotification, usePermission
- [x] Build passes ✓

### ✅ Phase 2 — Core POS (COMPLETE)
- [x] Products page — full CRUD (search, category filter, add/edit/delete modal, Zod validation)
- [x] Enhanced POS — category tabs, item discount, order discount slider, customer select
- [x] Payment modal (Cash/Card/QR/Transfer, change calc, quick presets)
- [x] Receipt component (printable via react-to-print, order details)
- [x] Orders page — paginated table, status filter, search, order detail modal, void order
- [x] Shared UI: Modal (portal), ConfirmDialog, Badge, Input components
- [x] Build passes ✓ (2480 modules)

### ✅ Phase 3 — Management (COMPLETE)
- [x] Customers page — list, CRUD, purchase history
- [x] Inventory page — stock levels, adjustments, low-stock alerts, movement history
- [x] Reports page — daily/weekly/monthly charts, category revenue, CSV export
- [x] Settings page — store info, tax rate, receipt footer

### ✅ Phase 4 — Expert Features (COMPLETE)
- [x] Hold & Recall cart — multiple saved transactions, hold/recall/delete with Zustand persist
- [x] Camera barcode scanner — `useCameraScanner` hook (html5-qrcode) + CameraScanModal
- [x] Promotions / Coupon engine — `promotionStore` with 5 mock promos, CouponInput with async validation
- [x] Offline support — IndexedDB product cache (idb), offline order queue (`offlineStore`), `useOfflineSync` hook
- [x] React 19.2 upgrades:
  - `useOptimistic` for instant cart feedback on product tap/scan
  - `useEffectEvent()` in `useBarcodeScanner` (stable callback without re-triggering effect)
  - `useEffectEvent()` in `useOfflineSync` (online/offline handlers, drain queue)
  - CSS-based tab state preservation (scroll position kept per category)
- [x] OfflineIndicator status badge in Header

### ✅ Phase 5 — Mobile & Print (COMPLETE)

#### ✅ M1 — Responsive Layout & Mobile Navigation
- [x] `useMediaQuery` / `useMobileLayout` hooks
- [x] `MobileBottomNav` (5-tab bar with cart badge)
- [x] `MobileMoreDrawer` (slide-up sheet for secondary nav)
- [x] `MainLayout` responsive (sidebar ↔ bottom nav)
- [x] PWA manifest via `vite-plugin-pwa` (installable, workbox SW)
- [x] `safe-area-inset-*` support throughout

#### ✅ M2 — Mobile POS (Sell on Phone)
- [x] Full-screen product grid, camera FAB
- [x] `MobileCartSheet` (bottom-sheet cart with swipe-to-remove)
- [x] `QuickNumpad` (tap product → numpad for qty)
- [x] Cart badge on bottom nav
- [x] POSPage mobile/desktop split rendering

#### ✅ M3 — Mobile Product Management
- [x] `ProductsPage` responsive: card list on mobile, table on desktop
- [x] Mobile FAB `+` button (bottom-right, above nav)
- [x] `hidden sm:flex` on desktop Add button

#### ✅ M4 — Mobile Inventory (Stock on the Go)
- [x] `InventoryPage` responsive: card list on mobile
- [x] Camera FAB → scan barcode → opens `StockAdjustModal` instantly
- [x] `handleScanAdjust` links scan result to product

#### ✅ M5 — Mobile Reports + Print
- [x] `usePrint` hook (react-to-print wrapper)
- [x] `PrintableReport` component (printable HTML with store info, trend table, top products)
- [x] "Print / PDF" button in `ReportsPage`
- [x] `@media print` CSS (hide nav, page breaks, color-adjust)
- [x] Export CSV button retained

> **Goal:** Full mobile-first experience — a cashier should be able to run a complete shift from a phone.

#### 📱 M1 — Responsive Layout & Mobile Navigation
| Feature | Detail |
|---|---|
| `useMediaQuery` hook | Detect `sm`/`md`/`lg` breakpoints reactively |
| `MobileLayout` | Bottom tab bar navigation (POS · Products · Inventory · Reports · Menu) replaces sidebar on mobile |
| Drawer sidebar | On tablet, sidebar becomes swipe-in drawer with gesture support |
| Safe-area support | `env(safe-area-inset-*)` padding for notch/home-indicator phones |
| PWA manifest | `vite-plugin-pwa` → installable, app icon, splash screen, standalone mode |
| Service Worker | Cache app shell for instant load; offline fallback page |

#### 📱 M2 — Mobile POS (Sell on Phone)
| Feature | Detail |
|---|---|
| Full-screen product grid | Larger tap targets (min 48px), 2-col grid on phone |
| Camera scanner button | Prominent FAB (floating action button) → opens `CameraScanModal` |
| Bottom sheet cart | Cart slides up from bottom (like a drawer) instead of right panel |
| Swipe-to-remove | Swipe cart item left → reveals delete action |
| Touch quantity stepper | Larger +/− buttons with haptic feedback hint |
| Quick-add numpad | Tap product → numpad popup for qty (skip stepper for fast entry) |
| Cart badge | Item count badge on bottom nav Cart tab |
| Checkout slide-up | Payment modal full-screen on mobile |

#### 📱 M3 — Mobile Product Management
| Feature | Detail |
|---|---|
| Responsive ProductsPage | Card list view on mobile (replaces table) |
| Mobile ProductForm | Full-screen slide-up sheet with large inputs |
| Scan-to-fill barcode | Camera scanner button inside Add Product form — scans & fills barcode field |
| Camera photo capture | `<input type="file" accept="image/*" capture="environment">` for product image |
| Floating Add button | FAB `+` bottom-right on products list |

#### 📱 M4 — Mobile Inventory (Stock on the Go)
| Feature | Detail |
|---|---|
| Responsive InventoryPage | Card list + low-stock badge on mobile |
| Quick-scan adjust | Scan barcode → opens `StockAdjustModal` instantly (no table navigation) |
| Scan-to-find product | Camera FAB → scan barcode → highlight/jump to product |
| Swipe to adjust | Swipe inventory row right → quick +1 stock button |

#### 📱 M5 — Mobile Reports + Print
| Feature | Detail |
|---|---|
| Responsive charts | Charts reflow: horizontal BarChart → vertical on mobile; reduce data points |
| `usePrint` hook | Wraps `react-to-print` with print-CSS injection |
| Print Report button | Printable HTML report: date range summary + top products table |
| Print CSS | `@media print` styles — hide nav/header, expand charts full-width, page breaks |
| PDF export | `window.print()` → "Save as PDF" via browser (no server needed) |
| Receipt reprint | Reprint any past order receipt from Orders page on mobile |
| Share report | Web Share API → share CSV/screenshot via native share sheet |

---

### ✅ Phase 6 — API Integration (COMPLETE)

- [x] Axios client (`src/lib/axios.ts`) — Bearer token attach, 401 silent refresh, 5xx flag
- [x] Token refresh queue — parallel requests wait while refresh is in-flight
- [x] `authStore.setToken()` added for interceptor to call after refresh
- [x] Real API services (`src/services/api/`) — all 6 services implemented
- [x] `queryClient.ts` — smart retry (skip 4xx, exp backoff on 5xx), prod-only window-focus refetch
- [x] `useApiQueries.ts` — 15 TanStack Query hooks (useProducts, useOrders, useCustomers, etc.)
- [x] `ApiErrorBoundary` — route-level error boundary for 404 / 403 / 5xx UI
- [x] `ReactQueryDevtools` — visible in dev mode (bottom-left)
- [x] `.env.development` / `.env.production` — `VITE_USE_MOCK` + `VITE_API_BASE_URL`
- [x] `docs/api-reference.md` — full REST API spec for backend developer

---

### Phase 7 — Scanner, Product Media, and Price Tag Roadmap (NEXT)

> **Goal:** make barcode workflows production-safe on mobile, reduce cashier friction when a product does not exist yet, add product photo support, and introduce printable price tags.

#### ✅ Priority Order
1. Replace camera scanner with **Quagga2** and fix duplicate-scan behavior.
2. Add **scan-to-create-product** flow from the sell page.
3. Add **barcode scanner inside Product Form**.
4. Add **product photo** support.
5. Add **price tag generator + print layout**.

#### P7.1 — Camera Scanner Migration (Quagga2)
- [x] Replace `html5-qrcode` camera flow with `@ericblade/quagga2` or `quagga2`
- [x] Keep existing keyboard / USB HID scanner flow (`useBarcodeScanner`) unchanged
- [x] Wrap Quagga initialization and teardown in a dedicated hook (`useQuaggaScanner`)
- [x] Support rear camera selection on mobile (`facingMode: environment` or best available device)
- [x] Normalize scan result parsing so POS and product form use the same decoded value contract

**Why:** current mobile camera flow can repeatedly fire while the same barcode stays in frame.

#### P7.2 — Duplicate Scan Protection (Critical Bug Fix)
- [x] Add `lastScannedCode` + timestamp dedupe window
- [x] Add short **success cooldown** after a valid scan (e.g. 1200-2000 ms)
- [x] Pause or ignore repeated detections while the same code remains visible
- [x] Resume scanning only after cooldown or when a different code is detected
- [x] Show visual state: `Scanning` / `Added` / `Duplicate ignored`

**Expected outcome:** holding the camera on one barcode adds only **one** product to cart.

#### P7.3 — Scan Unknown Barcode -> Create Product
- [x] In POS sell page, when barcode lookup returns no product, open **Add Product** modal automatically
- [x] Prefill scanned barcode into the barcode field
- [x] Keep cashier on current POS flow after save
- [x] After successful create, auto-add the new product to the cart
- [x] Show explicit not-found message with action: `Create product with this barcode`

**Flow:**
`Scan barcode -> not found -> open ProductForm with barcode prefilled -> save -> add to cart`

#### P7.4 — Barcode Scanner in Add / Edit Product Form
- [x] Add scan button inside `ProductForm`
- [x] Reuse the camera scan modal/hook instead of duplicating scanner logic
- [x] Fill `barcode` input from scanned value
- [x] Prevent overwrite without confirmation if barcode field already has a value
- [x] Support mobile-first layout for barcode scan action

#### P7.5 — Product Photo Support
- [x] Add image picker/upload UI to `ProductForm`
- [x] Show image preview before save
- [x] Save `imageUrl` through API
- [x] Update product card/grid to render real product image when available
- [x] Fallback to placeholder when no image exists

**Backend decision:**
- [x] Use **local on-prem upload endpoint + persistent storage** for offline deployments

#### P7.6 — Price Tag Generator and Print
- [x] Add new page for **Price Tag Generator**
- [x] Select one or many products
- [x] Configure copies / quantity per product
- [x] Generate printable tags with:
  - [x] product name
  - [x] selling price
  - [x] barcode
  - [x] optional store name
- [x] Add print stylesheet optimized for label paper
- [x] Support browser print / Save as PDF

#### Suggested Technical Changes

**Frontend**
- [ ] New hook: `useQuaggaScanner`
- [ ] Update `CameraScanModal` to use Quagga2 states and cooldown handling
- [ ] Update `POSPage` unknown-barcode branch to launch product creation flow
- [x] Update `ProductForm` with scanner trigger and image field
- [x] Add reusable `PriceTagPreview` / `PriceTagPrintSheet` components

**Backend / API**
- [ ] Confirm current `CreateProductDto` / `UpdateProductDto` supports `imageUrl` end-to-end
- [ ] If real upload is needed, add upload endpoint and storage strategy
- [ ] Ensure barcode uniqueness errors are surfaced clearly to frontend

#### Risks / Notes
- Quagga2 improves barcode scanning, but **does not by itself solve duplicate add-to-cart**; cooldown and dedupe logic are still required.
- Price-tag printing depends on target paper size (A4, sticker sheet, thermal label, etc.).
- Product photo upload scope should be decided early to avoid rework.

#### Deliverables by Milestone

**Milestone A — Stable Scanning**
- [x] Quagga2 scanner live
- [x] mobile duplicate-add bug fixed
- [x] scanner status feedback improved

**Milestone B — Faster Product Onboarding**
- [x] scan barcode inside product form
- [x] scan unknown code on POS -> create product popup -> add to cart

**Milestone C — Product Media**
- [x] photo upload / preview / display complete

**Milestone D — Price Tags**
- [x] product selection
- [x] printable tag template
- [x] print / PDF flow complete










### Phase 8 - Customer Display (Done)
- [x] Add standalone customer-facing display route for second monitor
- [x] Replace product catalog view with live cart and payment summary
- [x] Add realtime cross-window cart sync for scan, add item, checkout, and held bill reset
- [x] Show item quantities, line totals, subtotal, discount, tax, and total to pay


### Maintenance Update - Barcode Keyboard Layout Fix (Done)
- [x] Added keyboard-layout aware USB scanner handling for TH/EN input switching
- [x] Parse HID scanner input from physical key codes instead of localized characters
- [x] Normalize product barcode field entry to uppercase ASCII for scanner reliability

