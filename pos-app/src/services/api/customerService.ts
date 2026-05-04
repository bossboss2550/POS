import type { ICustomerService } from "../types";
import { apiGet, apiPost, apiPatch } from "@/lib/axios";
import type { Customer, PaginationParams, PaginatedResponse } from "@/types";

// Add frontend-only fields that the API does not store
function mapCustomer(c: any): Customer {
  return {
    ...c,
    loyaltyPoints: c.loyaltyPoints ?? 0,
    totalSpent: c.totalSpent ?? 0,
    memberTier: c.memberTier ?? "bronze",
    phone: c.phone ?? "",
    email: c.email ?? undefined,
    address: c.address ?? undefined,
  };
}

export const customerService: ICustomerService = {
  async getCustomers(params: PaginationParams = {}) {
    const { pageSize, ...rest } = params as any;
    const query: Record<string, unknown> = { ...rest };
    if (pageSize) query.limit = pageSize;
    const res = await apiGet<PaginatedResponse<any>>("/customers", query);
    return { ...res, data: res.data.map(mapCustomer) };
  },

  async getCustomerById(id) {
    const c = await apiGet<any>(`/customers/${id}`);
    return mapCustomer(c);
  },

  async createCustomer(data) {
    const c = await apiPost<any>("/customers", data);
    return mapCustomer(c);
  },

  async updateCustomer(id, data) {
    const c = await apiPatch<any>(`/customers/${id}`, data);
    return mapCustomer(c);
  },
};
