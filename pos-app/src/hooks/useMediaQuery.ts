import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

/** Production-safe replacement for useEffectEvent: stable callback that always calls latest fn */
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

/** Reactive CSS media query hook. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  const onMatch = useStableCallback((e: MediaQueryListEvent) => setMatches(e.matches));

  useEffect(() => {
    const mql = window.matchMedia(query);
    onMatch({ matches: mql.matches } as MediaQueryListEvent); // Call onMatch directly to set initial state
    mql.addEventListener("change", onMatch);
    return () => mql.removeEventListener("change", onMatch);
  }, [query, onMatch]);

  return matches;
}

/** Convenience hook: returns isMobile (<768px) and isTablet (<1024px) */
export function useMobileLayout() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(max-width: 1023px)");
  return { isMobile, isTablet, isDesktop: !isTablet };
}
