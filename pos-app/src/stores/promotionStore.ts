import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PromoType = "percentage" | "fixed" | "bxgy";

export interface Promotion {
  id: string;
  code: string;
  type: PromoType;
  value: number;          // % or flat ฿ amount
  description: string;
  minAmount: number;      // min order amount
  maxUses: number;        // 0 = unlimited
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  // buy X get Y fields
  buyQty?: number;
  getQty?: number;
  productId?: string;     // specific product for bxgy
}

// Seed mock promotions
const MOCK_PROMOS: Promotion[] = [
  {
    id: "p1", code: "SAVE10", type: "percentage", value: 10,
    description: "10% off your order", minAmount: 100, maxUses: 0,
    usedCount: 0, isActive: true,
  },
  {
    id: "p2", code: "FLAT50", type: "fixed", value: 50,
    description: "฿50 off orders over ฿500", minAmount: 500, maxUses: 100,
    usedCount: 23, isActive: true,
  },
  {
    id: "p3", code: "VIP20", type: "percentage", value: 20,
    description: "VIP member 20% off", minAmount: 0, maxUses: 50,
    usedCount: 12, isActive: true,
  },
  {
    id: "p4", code: "NEWUSER", type: "fixed", value: 30,
    description: "New customer ฿30 off", minAmount: 150, maxUses: 1,
    usedCount: 0, isActive: true,
  },
  {
    id: "p5", code: "EXPIRED", type: "percentage", value: 15,
    description: "Expired promo", minAmount: 0, maxUses: 0,
    usedCount: 0, isActive: false,
    expiresAt: "2024-01-01T00:00:00.000Z",
  },
];

interface PromotionStore {
  promotions: Promotion[];
  validateCoupon: (code: string, orderTotal: number) => { valid: boolean; discount: number; message: string; promo?: Promotion };
  usePromo: (id: string) => void;
}

export const usePromotionStore = create<PromotionStore>()(
  persist(
    (set, get) => ({
      promotions: MOCK_PROMOS,

      validateCoupon: (code, orderTotal) => {
        const promo = get().promotions.find(
          p => p.code.toUpperCase() === code.toUpperCase()
        );
        if (!promo)           return { valid: false, discount: 0, message: "Coupon code not found" };
        if (!promo.isActive)  return { valid: false, discount: 0, message: "This coupon is no longer active" };
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date())
                              return { valid: false, discount: 0, message: "This coupon has expired" };
        if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
                              return { valid: false, discount: 0, message: "This coupon has reached its usage limit" };
        if (orderTotal < promo.minAmount)
                              return { valid: false, discount: 0, message: `Minimum order amount is ฿${promo.minAmount.toFixed(0)}` };

        const discount = promo.type === "percentage"
          ? orderTotal * (promo.value / 100)
          : promo.value;

        return {
          valid: true,
          discount: Math.min(discount, orderTotal),
          message: promo.description,
          promo,
        };
      },

      usePromo: (id) =>
        set(s => ({
          promotions: s.promotions.map(p =>
            p.id === id ? { ...p, usedCount: p.usedCount + 1 } : p
          ),
        })),
    }),
    { name: "pos-promotions" }
  )
);
