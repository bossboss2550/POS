import { apiGet, apiPatch } from "@/lib/axios";
import type { StoreSettings } from "@/types";

// Map API flat key-value record to StoreSettings
function mapSettings(data: Record<string, string>): StoreSettings {
  return {
    storeName: data.storeName ?? "My POS Store",
    address: data.storeAddress ?? "",
    phone: data.storePhone ?? "",
    taxEnabled: data.taxEnabled === undefined ? true : data.taxEnabled === "true",
    taxRate: parseFloat(data.taxRate ?? "0.07"),
    currency: data.currency ?? "THB",
    currencySymbol: data.currencySymbol ?? "฿",
    receiptFooter: data.receiptFooter ?? "Thank you for shopping with us!",
  };
}

export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    const data = await apiGet<Record<string, string>>("/settings");
    return mapSettings(data);
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const payload: Record<string, string> = {};
    if (settings.storeName !== undefined) payload.storeName = settings.storeName;
    if (settings.address !== undefined) payload.storeAddress = settings.address;
    if (settings.phone !== undefined) payload.storePhone = settings.phone;
    if (settings.taxEnabled !== undefined) payload.taxEnabled = String(settings.taxEnabled);
    if (settings.taxRate !== undefined) payload.taxRate = String(settings.taxRate);
    if (settings.currency !== undefined) payload.currency = settings.currency;
    if (settings.currencySymbol !== undefined) payload.currencySymbol = settings.currencySymbol;
    if (settings.receiptFooter !== undefined) payload.receiptFooter = settings.receiptFooter;
    const data = await apiPatch<Record<string, string>>("/settings", payload);
    return mapSettings(data);
  },
};
