// ─── User / Auth ─────────────────────────────────────────────────────────────
export type UserRole = "admin" | "manager" | "cashier";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  branchId: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  imageUrl?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;       // percentage 0-100
  total: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  customerId?: string;
  discount: number;       // order-level discount percentage
  taxRate: number;
  note?: string;
  createdAt: string;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
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

// ─── Payment ─────────────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "card" | "qr" | "transfer";

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface Payment {
  id: string;
  orderId: string;
  splits: PaymentSplit[];
  total: number;
  change: number;
  createdAt: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface OrderItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export type StockMovementType = "in" | "out" | "adjustment" | "transfer";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  reason: string;
  userId: string;
  createdAt: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface DailySales {
  date: string;
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  avgOrderValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  lowStockCount: number;
  activeCustomers: number;
  salesTrend: DailySales[];
  topProducts: TopProduct[];
  recentOrders: Order[];
}

// ─── Settings ────────────────────────────────────────────────────────────────
export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  taxEnabled: boolean;
  taxRate: number;         // e.g. 0.07 = 7%
  currency: string;        // e.g. "THB"
  currencySymbol: string;  // e.g. "฿"
  receiptFooter: string;
  logoUrl?: string;
}

// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}



