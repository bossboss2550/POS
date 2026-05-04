import { useRef, useCallback, useLayoutEffect } from "react";

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

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 60 }: UseSwipeGestureOptions) {
  const startXRef = useRef(0);

  const onTouchStart = useStableCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  });

  const onTouchEnd = useStableCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - startXRef.current;
    if (delta < -threshold) onSwipeLeft?.();
    else if (delta > threshold) onSwipeRight?.();
  });

  return { onTouchStart, onTouchEnd };
}
