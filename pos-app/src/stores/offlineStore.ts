import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@/types";

export interface QueuedOrder {
  id: string;
  order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">;
  queuedAt: string;
  retries: number;
  status: "pending" | "syncing" | "failed";
}

interface OfflineStore {
  isOnline: boolean;
  isSyncing: boolean;
  queue: QueuedOrder[];
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  enqueue: (order: QueuedOrder["order"]) => string;
  dequeue: (id: string) => void;
  markFailed: (id: string) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set) => ({
      isOnline: navigator.onLine,
      isSyncing: false,
      queue: [],

      setOnline: (isOnline) => set({ isOnline }),
      setSyncing: (isSyncing) => set({ isSyncing }),

      enqueue: (order) => {
        const id = `queued-${Date.now()}`;
        const item: QueuedOrder = {
          id, order, queuedAt: new Date().toISOString(), retries: 0, status: "pending",
        };
        set(s => ({ queue: [...s.queue, item] }));
        return id;
      },

      dequeue: (id) =>
        set(s => ({ queue: s.queue.filter(q => q.id !== id) })),

      markFailed: (id) =>
        set(s => ({
          queue: s.queue.map(q =>
            q.id === id ? { ...q, status: "failed" as const, retries: q.retries + 1 } : q
          ),
        })),

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: "pos-offline-queue",
      partialize: (s) => ({ queue: s.queue }),
    }
  )
);

