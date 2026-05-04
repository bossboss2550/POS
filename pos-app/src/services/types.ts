import type {
  User,
  Product,
  Category,
  Customer,
  Order,
  StockMovement,
  StockMovementType,
  OrderStatus,
  DashboardSummary,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

export type ProductUpsertInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export interface IAuthService {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  me(token: string): Promise<User>;
}

export interface IProductService {
  getProducts(params?: PaginationParams & { categoryId?: string }): Promise<PaginatedResponse<Product>>;
  getProductById(id: string): Promise<Product>;
  getProductByBarcode(barcode: string): Promise<Product | null>;
  createProduct(data: ProductUpsertInput): Promise<Product>;
  updateProduct(id: string, data: Partial<ProductUpsertInput>): Promise<Product>;
  uploadProductImage(file: File): Promise<string>;
  deleteProduct(id: string): Promise<void>;
  getCategories(): Promise<Category[]>;
}

export interface IOrderService {
  getOrders(params?: PaginationParams & { status?: OrderStatus; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<Order>>;
  getOrderById(id: string): Promise<Order>;
  createOrder(data: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
}

export interface ICustomerService {
  getCustomers(params?: PaginationParams): Promise<PaginatedResponse<Customer>>;
  getCustomerById(id: string): Promise<Customer>;
  createCustomer(data: Omit<Customer, "id" | "loyaltyPoints" | "totalSpent" | "createdAt">): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>;
}

export interface IInventoryService {
  getStockMovements(params?: PaginationParams & { productId?: string }): Promise<PaginatedResponse<StockMovement>>;
  adjustStock(productId: string, quantity: number, type: StockMovementType, reason: string): Promise<StockMovement>;
  getLowStockProducts(): Promise<Product[]>;
}

export interface IReportService {
  getDashboard(): Promise<DashboardSummary>;
}
