import type { IReportService } from "../types";
import { mockOrders, mockProducts, mockCustomers } from "./mockData";
import dayjs from "dayjs";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const reportService: IReportService = {
  async getDashboard() {
    await delay();
    const today = dayjs().format("YYYY-MM-DD");
    const todayOrders = mockOrders.filter(o => o.status === "paid" && o.createdAt.startsWith(today));
    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);

    // 7-day trend
    const salesTrend = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().subtract(6 - i, "day").format("YYYY-MM-DD");
      const dayOrders = mockOrders.filter(o => o.status === "paid" && o.createdAt.startsWith(date));
      const totalSales = dayOrders.reduce((s, o) => s + o.total, 0);
      return { date, totalSales, totalOrders: dayOrders.length, totalItems: dayOrders.flatMap(o => o.items).reduce((s, it) => s + it.quantity, 0), avgOrderValue: dayOrders.length ? totalSales / dayOrders.length : 0 };
    });

    // Top products from all paid orders
    const productSales: Record<string, { productId: string; productName: string; quantitySold: number; revenue: number }> = {};
    mockOrders.filter(o => o.status === "paid").forEach(o => {
      o.items.forEach(it => {
        if (!productSales[it.productId]) productSales[it.productId] = { productId: it.productId, productName: it.productName, quantitySold: 0, revenue: 0 };
        productSales[it.productId].quantitySold += it.quantity;
        productSales[it.productId].revenue += it.total;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const lowStockCount = mockProducts.filter(p => p.stock <= p.minStock).length;

    return {
      todaySales, todayOrders: todayOrders.length, lowStockCount,
      activeCustomers: mockCustomers.length,
      salesTrend, topProducts, recentOrders: mockOrders.slice(0, 10),
    };
  },
};
