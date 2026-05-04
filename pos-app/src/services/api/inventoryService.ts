import type { IInventoryService } from "../types";
import { apiGet, apiPost } from "@/lib/axios";
import type { StockMovement, StockMovementType, PaginatedResponse, Product } from "@/types";

// Map API movement type (uppercase) to frontend (lowercase)
const TYPE_MAP: Record<string, StockMovementType> = {
  SALE: "out",
  PURCHASE: "in",
  ADJUSTMENT: "adjustment",
  TRANSFER: "transfer",
  RETURN: "in",
};

// Map frontend adjustment type to API enum
const TYPE_API_MAP: Record<StockMovementType, string> = {
  in: "PURCHASE",
  out: "ADJUSTMENT",
  adjustment: "ADJUSTMENT",
  transfer: "TRANSFER",
};

function mapMovement(m: any): StockMovement {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.productName ?? m.product?.name ?? "",
    type: TYPE_MAP[m.type] ?? "adjustment",
    quantity: Math.abs(m.quantity),
    // Use the sign of quantity to compute before/after so UI shows correct color
    beforeStock: m.quantity < 0 ? Math.abs(m.quantity) : 0,
    afterStock: m.quantity >= 0 ? m.quantity : 0,
    reason: m.reason ?? m.note ?? "",
    userId: m.userId ?? "",
    createdAt: m.createdAt,
  };
}

export const inventoryService: IInventoryService = {
  async getStockMovements(params = {}) {
    const { productId, pageSize, ...rest } = params as any;
    const query: Record<string, unknown> = { ...rest };
    if (pageSize) query.limit = pageSize;

    if (productId) {
      // Get movements for a specific product
      const res = await apiGet<PaginatedResponse<any>>(
        `/inventory/${productId}/movements`, query
      );
      return { ...res, data: res.data.map(mapMovement) };
    }
    // Get all movements across all products
    const res = await apiGet<PaginatedResponse<any>>("/inventory/movements", query);
    return { ...res, data: res.data.map(mapMovement) };
  },

  async adjustStock(productId, quantity, type: StockMovementType, reason) {
    // For "adjustment" type, the UI means "set stock to X" (absolute).
    // The API computes: newQty = currentQty + dto.quantity (delta-based).
    // We need to fetch current stock to compute the delta.
    let qty = quantity;
    const apiType = TYPE_API_MAP[type];

    if (type === "adjustment") {
      const product = await apiGet<any>(`/products/${productId}`);
      const currentStock = product.stock ?? product.stock?.quantity ?? 0;
      qty = quantity - currentStock; // delta = target - current
    } else if (type === "out") {
      qty = -quantity; // negative = stock removal
    }

    const result = await apiPost<[any, any]>(
      `/inventory/${productId}/adjust`,
      { type: apiType, quantity: qty, note: reason }
    );
    const movement = Array.isArray(result) ? result[1] : result;
    return mapMovement({ ...movement, productId });
  },

  async getLowStockProducts() {
    // API doesn't have a dedicated low-stock endpoint; use products with lowStock flag
    const res = await apiGet<PaginatedResponse<Product>>("/products", { lowStock: true, limit: 100 });
    return res.data;
  },
};
