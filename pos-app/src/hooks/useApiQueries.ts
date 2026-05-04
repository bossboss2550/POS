/**
 * TanStack Query hooks — provide caching, background refresh,
 * optimistic updates and retry logic on top of the service layer.
 *
 * Query key convention:
 *   ["resource"]                    → list/summary
 *   ["resource", id]                → single item
 *   ["resource", "filter", params]  → filtered list
 */
import {
  useQuery, useMutation, useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getServices } from "@/services";
import type {
  Product, Order, Customer,
  StockMovement,
  PaginationParams, OrderStatus,
} from "@/types";

// ─── Stale times ──────────────────────────────────────────────────────────────
const STALE = {
  REALTIME:  0,           // always refetch (cart, orders)
  SHORT:     30_000,      // 30 s (products, inventory)
  MEDIUM:    5 * 60_000,  // 5 min (customers, categories)
  LONG:      30 * 60_000, // 30 min (rarely changing data)
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
type ProductParams = PaginationParams & { categoryId?: string };

export function useProducts(params: ProductParams = {}, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { productService } = await getServices();
      return productService.getProducts(params);
    },
    staleTime: STALE.SHORT,
    ...options,
  });
}

export function useProduct(id: string, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { productService } = await getServices();
      return productService.getProductById(id);
    },
    enabled: !!id,
    staleTime: STALE.SHORT,
    ...options,
  });
}

export function useCategories(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { productService } = await getServices();
      return productService.getCategories();
    },
    staleTime: STALE.LONG,
    ...options,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const { productService } = await getServices();
      return productService.createProduct(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { productService } = await getServices();
      return productService.updateProduct(id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { productService } = await getServices();
      return productService.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
type OrderParams = PaginationParams & { status?: OrderStatus; dateFrom?: string; dateTo?: string };

export function useOrders(params: OrderParams = {}, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const { orderService } = await getServices();
      return orderService.getOrders(params);
    },
    staleTime: STALE.REALTIME,
    ...options,
  });
}

export function useOrder(id: string, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const { orderService } = await getServices();
      return orderService.getOrderById(id);
    },
    enabled: !!id,
    staleTime: STALE.SHORT,
    ...options,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">) => {
      const { orderService } = await getServices();
      return orderService.createOrder(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stock changes
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { orderService } = await getServices();
      return orderService.updateOrderStatus(id, status);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", id] });
    },
  });
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export function useCustomers(params: PaginationParams = {}, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const { customerService } = await getServices();
      return customerService.getCustomers(params);
    },
    staleTime: STALE.MEDIUM,
    ...options,
  });
}

export function useCustomer(id: string, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const { customerService } = await getServices();
      return customerService.getCustomerById(id);
    },
    enabled: !!id,
    staleTime: STALE.MEDIUM,
    ...options,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Customer, "id" | "loyaltyPoints" | "totalSpent" | "createdAt">) => {
      const { customerService } = await getServices();
      return customerService.createCustomer(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const { customerService } = await getServices();
      return customerService.updateCustomer(id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customers", id] });
    },
  });
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
type MovementParams = PaginationParams & { productId?: string };

export function useStockMovements(params: MovementParams = {}, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["stock-movements", params],
    queryFn: async () => {
      const { inventoryService } = await getServices();
      return inventoryService.getStockMovements(params);
    },
    staleTime: STALE.SHORT,
    ...options,
  });
}

export function useLowStockProducts(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: async () => {
      const { inventoryService } = await getServices();
      return inventoryService.getLowStockProducts();
    },
    staleTime: STALE.SHORT,
    ...options,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId, quantity, type, reason,
    }: { productId: string; quantity: number; type: StockMovement["type"]; reason: string }) => {
      const { inventoryService } = await getServices();
      return inventoryService.adjustStock(productId, quantity, type, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
}

// ─── REPORTS / DASHBOARD ──────────────────────────────────────────────────────
export function useDashboard(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { reportService } = await getServices();
      return reportService.getDashboard();
    },
    staleTime: STALE.SHORT,
    refetchInterval: 60_000, // auto-refresh every minute
    ...options,
  });
}
