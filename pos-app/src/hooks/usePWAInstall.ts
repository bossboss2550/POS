import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Captures the browser beforeinstallprompt event for deferred PWA install. */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]     = useState(false);

  const onPrompt = useStableCallback((e: Event) => {
    e.preventDefault();
    setInstallPrompt(e as BeforeInstallPromptEvent);
  });

  const onAppInstalled = useStableCallback(() => {
    setIsInstalled(true);
    setInstallPrompt(null);
  });

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    // Defer the setIsInstalled call to avoid synchronous setState in effect
    setTimeout(() => {
      if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    }, 0);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [onPrompt, onAppInstalled]);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    return outcome === "accepted";
  };

  return { canInstall: !!installPrompt && !isInstalled, isInstalled, promptInstall };
}
