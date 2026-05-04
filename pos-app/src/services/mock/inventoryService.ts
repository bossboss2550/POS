import type { StockMovement } from "@/types";
import type { IInventoryService } from "../types";
import { mockStockMovements, mockProducts } from "./mockData";

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
let movements = [...mockStockMovements];
let products = [...mockProducts];

export const inventoryService: IInventoryService = {
  async getStockMovements(params = {}) {
    await delay();
    let filtered = [...movements];
    if (params.productId) filtered = filtered.filter(m => m.productId === params.productId);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async adjustStock(productId, quantity, type, reason) {
    await delay();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error("Product not found");
    const beforeStock = product.stock;
    const afterStock = type === "in" ? beforeStock + Math.abs(quantity) : beforeStock - Math.abs(quantity);
    products = products.map(p => p.id === productId ? { ...p, stock: afterStock } : p);
    const movement: StockMovement = {
      id: `sm-${Date.now()}`, productId, productName: product.name,
      type, quantity, beforeStock, afterStock, reason,
      userId: "u1", createdAt: new Date().toISOString(),
    };
    movements = [movement, ...movements];
    return movement;
  },

  async getLowStockProducts() {
    await delay();
    return products.filter(p => p.stock <= p.minStock);
  },
};
