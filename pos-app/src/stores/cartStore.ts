import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Customer, Product } from "@/types";
import { roundCurrency } from "@/utils";

const CART_STORAGE_KEY = "pos-cart";
const CART_SYNC_CHANNEL = "pos-cart-sync";

export interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  customer: Customer | null;
  orderDiscount: number;
  note: string;
  savedAt: string;
}

interface CartStore {
  items: CartItem[];
  customer: Customer | null;
  orderDiscount: number;
  taxRate: number;
  note: string;
  couponCode: string;
  couponDiscount: number;
  savedCarts: SavedCart[];
  subtotal: () => number;
  discountAmount: () => number;
  taxAmount: () => number;
  total: () => number;
  itemCount: () => number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setOrderDiscount: (discount: number) => void;
  setNote: (note: string) => void;
  setCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  holdCart: (name?: string) => string;
  recallCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
}

type CartSyncSnapshot = Pick<
  CartStore,
  | "items"
  | "customer"
  | "orderDiscount"
  | "taxRate"
  | "note"
  | "couponCode"
  | "couponDiscount"
  | "savedCarts"
>;

interface PersistedCartState {
  state?: CartSyncSnapshot;
}

interface CartSyncMessage {
  type: "cart-sync";
  source: string;
  payload: CartSyncSnapshot;
}

const recalcTotal = (item: CartItem): CartItem => ({
  ...item,
  total: roundCurrency(item.unitPrice * item.quantity * (1 - item.discount / 100)),
});

const getCartSnapshot = (state: CartStore): CartSyncSnapshot => ({
  items: state.items,
  customer: state.customer,
  orderDiscount: state.orderDiscount,
  taxRate: state.taxRate,
  note: state.note,
  couponCode: state.couponCode,
  couponDiscount: state.couponDiscount,
  savedCarts: state.savedCarts,
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      orderDiscount: 0,
      taxRate: 0.07,
      note: "",
      couponCode: "",
      couponDiscount: 0,
      savedCarts: [],

      subtotal: () => roundCurrency(get().items.reduce((sum, item) => sum + item.total, 0)),
      discountAmount: () => roundCurrency(get().subtotal() * (get().orderDiscount / 100) + get().couponDiscount),
      taxAmount: () => roundCurrency((get().subtotal() - get().discountAmount()) * get().taxRate),
      total: () => roundCurrency(Math.max(0, get().subtotal() - get().discountAmount() + get().taxAmount())),
      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      addItem: (product, quantity = 1) => {
        const existing = get().items.find((item) => item.product.id === product.id);

        if (existing) {
          set((state) => ({
            items: state.items.map((item) =>
              item.product.id === product.id
                ? recalcTotal({ ...item, quantity: item.quantity + quantity })
                : item,
            ),
          }));
          return;
        }

        const newItem: CartItem = recalcTotal({
          product,
          quantity,
          unitPrice: product.price,
          discount: 0,
          total: 0,
        });

        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? recalcTotal({ ...item, quantity }) : item,
          ),
        }));
      },

      updateItemDiscount: (productId, discount) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? recalcTotal({ ...item, discount }) : item,
          ),
        })),

      setCustomer: (customer) => set({ customer }),
      setOrderDiscount: (orderDiscount) => set({ orderDiscount }),
      setNote: (note) => set({ note }),
      setCoupon: (couponCode, couponDiscount) => set({ couponCode, couponDiscount }),
      removeCoupon: () => set({ couponCode: "", couponDiscount: 0 }),
      clearCart: () =>
        set({
          items: [],
          customer: null,
          orderDiscount: 0,
          note: "",
          couponCode: "",
          couponDiscount: 0,
        }),

      holdCart: (name) => {
        const state = get();

        if (state.items.length === 0) {
          return "";
        }

        const id = `held-${Date.now()}`;
        const savedCart: SavedCart = {
          id,
          name: name ?? `Cart #${state.savedCarts.length + 1}`,
          items: [...state.items],
          customer: state.customer,
          orderDiscount: state.orderDiscount,
          note: state.note,
          savedAt: new Date().toISOString(),
        };

        set((currentState) => ({ savedCarts: [...currentState.savedCarts, savedCart] }));
        get().clearCart();
        return id;
      },

      recallCart: (id) => {
        const saved = get().savedCarts.find((cart) => cart.id === id);

        if (!saved) {
          return;
        }

        set({
          items: [...saved.items],
          customer: saved.customer,
          orderDiscount: saved.orderDiscount,
          note: saved.note,
          couponCode: "",
          couponDiscount: 0,
          savedCarts: get().savedCarts.filter((cart) => cart.id !== id),
        });
      },

      deleteHeldCart: (id) =>
        set((state) => ({
          savedCarts: state.savedCarts.filter((cart) => cart.id !== id),
        })),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: getCartSnapshot,
    },
  ),
);

if (typeof window !== "undefined") {
  const syncSourceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const broadcastChannel = "BroadcastChannel" in window
    ? new BroadcastChannel(CART_SYNC_CHANNEL)
    : null;
  let applyingRemoteSnapshot = false;

  const applySnapshot = (snapshot: CartSyncSnapshot) => {
    applyingRemoteSnapshot = true;
    useCartStore.setState(snapshot);
    applyingRemoteSnapshot = false;
  };

  broadcastChannel?.addEventListener("message", (event: MessageEvent<CartSyncMessage>) => {
    const message = event.data;

    if (message.type !== "cart-sync" || message.source === syncSourceId) {
      return;
    }

    applySnapshot(message.payload);
  });

  window.addEventListener("storage", (event) => {
    if (broadcastChannel || event.key !== CART_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const persistedState = JSON.parse(event.newValue) as PersistedCartState;

      if (persistedState.state) {
        applySnapshot(persistedState.state);
      }
    } catch (error) {
      console.error("Failed to sync cart state from storage", error);
    }
  });

  useCartStore.subscribe((state) => {
    if (applyingRemoteSnapshot || !broadcastChannel) {
      return;
    }

    broadcastChannel.postMessage({
      type: "cart-sync",
      source: syncSourceId,
      payload: getCartSnapshot(state),
    } satisfies CartSyncMessage);
  });
}
