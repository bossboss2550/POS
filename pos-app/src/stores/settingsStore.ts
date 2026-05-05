import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreSettings } from "@/types";

interface SettingsStore {
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

const defaults: StoreSettings = {
  storeName: "My POS Store",
  address: "123 Main Street",
  phone: "02-123-4567",
  taxEnabled: true,
  taxRate: 0.07,
  currency: "THB",
  currencySymbol: "฿",
  receiptFooter: "Thank you for shopping with us!",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      settings: defaults,
      updateSettings: settings => set(s => ({ settings: { ...s.settings, ...settings } })),
    }),
    { name: "pos-settings" }
  )
);
