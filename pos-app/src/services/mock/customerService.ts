import type { Customer } from "@/types";
import type { ICustomerService } from "../types";
import { mockCustomers } from "./mockData";

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
let customers = [...mockCustomers];

export const customerService: ICustomerService = {
  async getCustomers(params = {}) {
    await delay();
    let filtered = [...customers];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getCustomerById(id) {
    await delay(200);
    const c = customers.find(c => c.id === id);
    if (!c) throw new Error("Customer not found");
    return c;
  },

  async createCustomer(data) {
    await delay();
    const customer: Customer = {
      ...data, id: `c-${Date.now()}`,
      loyaltyPoints: 0, totalSpent: 0,
      memberTier: "bronze",
      createdAt: new Date().toISOString(),
    };
    customers = [...customers, customer];
    return customer;
  },

  async updateCustomer(id, data) {
    await delay();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Customer not found");
    const updated = { ...customers[idx], ...data };
    customers = customers.map(c => c.id === id ? updated : c);
    return updated;
  },
};
