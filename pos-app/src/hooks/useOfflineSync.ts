import { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useOfflineStore } from "@/stores/offlineStore";
import { productCache } from "@/lib/indexedDb";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import type { Product } from "@/types";

function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef(fn);

  useLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const stableCallback = useCallback((...args: Parameters<T>) => {
    return fnRef.current(...args);
  }, []);

  return stableCallback as T;
}

interface UseOfflineSyncOptions {
  syncProducts?: boolean;
  syncQueue?: boolean;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const { syncProducts = true, syncQueue = true } = options;
  const { setOnline, setSyncing, queue, dequeue, markFailed } = useOfflineStore();
  const notify = useNotification();
  const syncingRef = useRef(false);

  // Stable callbacks that always see latest closure values
  const drainQueue = useStableCallback(async () => {
    if (syncingRef.current || queue.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);

    const { orderService } = await getServices();
    const pending = queue.filter(q => q.status !== "failed" || q.retries < 3);

    for (const item of pending) {
      try {
        await orderService.createOrder(item.order);
        dequeue(item.id);
      } catch {
        markFailed(item.id);
      }
    }

    syncingRef.current = false;
    setSyncing(false);

    const synced = queue.length - useOfflineStore.getState().queue.length;
    if (synced > 0) notify.success(`Synced ${synced} offline order${synced > 1 ? "s" : ""}`);
  });

  const onComeOnline = useStableCallback(() => {
    setOnline(true);
    notify.info("Back online");
    if (syncQueue) drainQueue();
  });

  const onGoOffline = useStableCallback(() => {
    setOnline(false);
    notify.warning("You are offline — orders will be queued");
  });

  useEffect(() => {
    window.addEventListener("online", onComeOnline);
    window.addEventListener("offline", onGoOffline);
    return () => {
      window.removeEventListener("online", onComeOnline);
      window.removeEventListener("offline", onGoOffline);
    };
  }, [onComeOnline, onGoOffline]);

  const syncProductCache = useCallback(async (): Promise<Product[]> => {
    const lastSynced = await productCache.getLastSynced();
    const ageMs = lastSynced ? Date.now() - new Date(lastSynced).getTime() : Infinity;
    const stale = ageMs > 10 * 60 * 1000;

    if (!stale) {
      const cached = await productCache.getAll();
      if (cached.length > 0) return cached;
    }

    try {
      const { productService } = await getServices();
      const res = await productService.getProducts({ pageSize: 500 });
      await productCache.putAll(res.data);
      await productCache.setLastSynced(new Date().toISOString());
      return res.data;
    } catch {
      return productCache.getAll();
    }
  }, []);

  useEffect(() => {
    if (syncProducts) syncProductCache();
  }, [syncProducts, syncProductCache]);

  return { syncProductCache };
}
