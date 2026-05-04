import { useState, useCallback, useRef, useLayoutEffect } from "react";

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

type SnapPoint = "closed" | "half" | "full";

interface UseBottomSheetOptions {
  defaultSnap?: SnapPoint;
  onClose?: () => void;
}

export function useBottomSheet({ defaultSnap = "closed", onClose }: UseBottomSheetOptions = {}) {
  const [snap, setSnap] = useState<SnapPoint>(defaultSnap);
  const startYRef = useRef(0);

  const open   = useCallback((s: SnapPoint = "full") => setSnap(s), []);
  const close  = useCallback(() => { setSnap("closed"); onClose?.(); }, [onClose]);
  const toggle = useCallback(() => setSnap(s => s === "closed" ? "full" : "closed"), []);

  const onTouchStart = useStableCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  });

  const onTouchEnd = useStableCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 80) close();
    else if (delta < -60) setSnap("full");
  });

  const heightMap: Record<SnapPoint, string> = {
    closed: "0%",
    half:   "50%",
    full:   "92%",
  };

  return {
    snap,
    isOpen: snap !== "closed",
    open, close, toggle,
    sheetProps: {
      style: {
        height: heightMap[snap],
        transition: "height 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
      },
      onTouchStart,
      onTouchEnd,
    },
  };
}
