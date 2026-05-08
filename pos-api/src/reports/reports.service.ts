import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function mapOrder(o: any) {
  return {
    ...o,
    cashierName: o.cashier?.name ?? '',
    customerName: o.customer?.name ?? undefined,
    subtotal: Number(o.subtotal),
    taxAmount: Number(o.taxAmount),
    discountAmount: Number(o.discountAmount),
    total: Number(o.total),
    status: (o.status as string).toLowerCase(),
    items: (o.items ?? []).map((i: any) => ({
      productId: i.productId,
      productName: i.name ?? '',
      barcode: '',
      quantity: i.quantity,
      unitPrice: Number(i.price),
      discount: Number(i.discount ?? 0),
      total: Number(i.price) * i.quantity - Number(i.discount ?? 0),
    })),
    payment: o.payment
      ? {
          method: (o.payment.method as string).toLowerCase(),
          amount: Number(o.payment.amount),
          change: Number(o.payment.change ?? 0),
        }
      : undefined,
  };
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(range: 'today' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let daysToLookback = 0;
    if (range === 'today') {
      daysToLookback = 0;
    } else if (range === 'week') {
      daysToLookback = 6;
      startDate.setDate(startDate.getDate() - 6);
    } else if (range === 'month') {
      daysToLookback = 29;
      startDate.setDate(startDate.getDate() - 29);
    }

    const [rangeOrders, totalProducts, lowStockCount, activeCustomers] =
      await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: { createdAt: { gte: startDate }, status: 'PAID' },
          select: { total: true, createdAt: true, items: { select: { quantity: true } } },
        }),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.stock.count({ where: { quantity: { lte: 5 } } }),
        this.prisma.customer.count({ where: { isActive: true } }),
      ]);

    const totalSalesInRange = rangeOrders.reduce((s, o) => s + Number(o.total), 0);

    // Dynamic sales trend based on lookback
    const trendMap: Record<string, { totalSales: number; totalOrders: number; totalItems: number }> = {};
    for (let i = daysToLookback; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { totalSales: 0, totalOrders: 0, totalItems: 0 };
    }

    for (const o of rangeOrders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (trendMap[key]) {
        trendMap[key].totalSales += Number(o.total);
        trendMap[key].totalOrders += 1;
        trendMap[key].totalItems += o.items.reduce((s, i) => s + i.quantity, 0);
      }
    }

    const salesTrend = Object.entries(trendMap).map(([date, v]) => ({
      date: range === 'today' ? date : date.split('-').slice(1).join('/'), // Simpler labels for charts
      totalSales: v.totalSales,
      totalOrders: v.totalOrders,
      totalItems: v.totalItems,
      avgOrderValue: v.totalOrders > 0 ? v.totalSales / v.totalOrders : 0,
    }));

    // Top products in range
    const topProductsRaw = await this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true },
      where: { order: { status: 'PAID', createdAt: { gte: startDate } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductRevenues = await Promise.all(
      topProductsRaw.map(async (p) => {
        const items = await this.prisma.orderItem.findMany({
          where: { productId: p.productId, order: { status: 'PAID', createdAt: { gte: startDate } } },
          select: { price: true, quantity: true, discount: true },
        });
        const revenue = items.reduce(
          (s, i) => s + Number(i.price) * i.quantity - Number(i.discount ?? 0),
          0,
        );
        return {
          productId: p.productId,
          productName: p.name,
          quantitySold: p._sum.quantity ?? 0,
          revenue,
        };
      }),
    );

    // Recent orders (not scoped by date range, always show last 10)
    const recentOrdersRaw = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        payment: true,
      },
    });

    return {
      todaySales: totalSalesInRange,
      todayOrders: rangeOrders.length,
      totalProducts,
      lowStockCount,
      activeCustomers,
      salesTrend,
      topProducts: topProductRevenues,
      recentOrders: recentOrdersRaw.map(mapOrder),
    };
  }

  async getSalesSummary(from: string, to: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      grouped[key] = (grouped[key] ?? 0) + Number(o.total);
    }

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }

  async getCategoryRevenue() {
    const result = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { order: { status: 'PAID' } },
    });

    const withCategory = await Promise.all(
      result.map(async (r) => {
        const product = await this.prisma.product.findUnique({
          where: { id: r.productId },
          include: { category: true },
        });
        return { category: product?.category?.name ?? 'Unknown', qty: r._sum.quantity };
      }),
    );

    const byCategory: Record<string, number> = {};
    for (const r of withCategory) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + (r.qty ?? 0);
    }

    return Object.entries(byCategory).map(([category, totalSold]) => ({ category, totalSold }));
  }
}
