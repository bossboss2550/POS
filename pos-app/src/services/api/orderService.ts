import type { IOrderService } from "../types";
import { apiGet, apiPost, apiPatch } from "@/lib/axios";
import type { Order, OrderStatus, PaginationParams, PaginatedResponse } from "@/types";

type OrderFilters = PaginationParams & { status?: OrderStatus; dateFrom?: string; dateTo?: string };

export const orderService: IOrderService = {
  async getOrders(params: OrderFilters = {}) {
    const { pageSize, status, dateFrom, dateTo, ...rest } = params as any;
    const query: Record<string, unknown> = { ...rest };
    if (pageSize) query.limit = pageSize;
    if (status) query.status = status.toUpperCase();
    if (dateFrom) query.from = dateFrom;
    if (dateTo) query.to = dateTo;
    return apiGet<PaginatedResponse<Order>>("/orders", query);
  },

  async getOrderById(id) {
    return apiGet<Order>(`/orders/${id}`);
  },

  async createOrder(data: any) {
    // Transform frontend Order shape → NestJS CreateOrderDto
    const paymentMethod = (
      data.payment?.splits?.[0]?.method ??
      data.payment?.method ??
      "cash"
    ).toUpperCase() as string;

    const paymentAmount =
      data.payment?.splits?.[0]?.amount ??
      data.payment?.amount ??
      data.total;

    const items = (data.items ?? []).map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
      ...(i.discount ? { discount: i.discount } : {}),
    }));

    const dto: Record<string, unknown> = {
      items,
      paymentMethod,
      paymentAmount,
      ...(data.customerId != null ? { customerId: data.customerId } : {}),
      ...(data.note ? { note: data.note } : {}),
      ...(data.couponCode ? { couponCode: data.couponCode } : {}),
    };

    return apiPost<Order>("/orders", dto);
  },

  async updateOrderStatus(id, status: OrderStatus) {
    // API only supports voiding (cancel). Map "cancelled" → void endpoint.
    if (status === "cancelled") {
      return apiPatch<Order>(`/orders/${id}/void`, {});
    }
    // For other status changes, patch status directly (may not be supported)
    return apiPatch<Order>(`/orders/${id}`, { status: status.toUpperCase() });
  },
};
