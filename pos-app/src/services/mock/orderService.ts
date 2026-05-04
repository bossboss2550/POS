import type { Order } from "@/types";
import type { IOrderService } from "../types";
import { mockOrders } from "./mockData";
import dayjs from "dayjs";

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
let orders = [...mockOrders];
let counter = orders.length + 1;

export const orderService: IOrderService = {
  async getOrders(params = {}) {
    await delay();
    let filtered = [...orders];
    if (params.status) filtered = filtered.filter(o => o.status === params.status);
    if (params.dateFrom) filtered = filtered.filter(o => o.createdAt >= params.dateFrom!);
    if (params.dateTo)   filtered = filtered.filter(o => o.createdAt <= params.dateTo!);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(o => o.orderNumber.toLowerCase().includes(q) || (o.customerName?.toLowerCase().includes(q)));
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getOrderById(id) {
    await delay(200);
    const o = orders.find(o => o.id === id);
    if (!o) throw new Error("Order not found");
    return o;
  },

  async createOrder(data) {
    await delay(500);
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      id: `ord-${counter.toString().padStart(4, "0")}`,
      orderNumber: `INV-${dayjs().format("YYYYMMDD")}-${counter.toString().padStart(3, "0")}`,
      status: "paid",
      createdAt: now, updatedAt: now,
    };
    counter++;
    orders = [order, ...orders];
    return order;
  },

  async updateOrderStatus(id, status) {
    await delay();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error("Order not found");
    const updated = { ...orders[idx], status, updatedAt: new Date().toISOString() };
    orders = orders.map(o => o.id === id ? updated : o);
    return updated;
  },
};
