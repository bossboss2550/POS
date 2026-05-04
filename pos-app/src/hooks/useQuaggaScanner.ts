import { useEffect, useRef, useCallback, useLayoutEffect } from "react";

type QuaggaModule = Awaited<typeof import("@ericblade/quagga2")>["default"];

type QuaggaDetectedResult = {
  codeResult?: {
    code?: string | null;
  };
};

export type QuaggaScanStatus = "scanning" | "matched" | "duplicate_ignored" | "error";

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

interface UseQuaggaScannerOptions {
  elementId?: string;
  enabled?: boolean;
  cooldownMs?: number;
  onScan: (barcode: string) => void;
  onDuplicate?: (barcode: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: QuaggaScanStatus) => void;
}

const READER_TYPES = [
  "ean_reader",
  "ean_8_reader",
  "upc_reader",
  "upc_e_reader",
  "code_128_reader",
  "code_39_reader",
  "codabar_reader",
] as const;

/** Camera-based barcode scanner using Quagga2. */
export function useQuaggaScanner({
  elementId = "camera-scan-region",
  enabled = false,
  cooldownMs = 1500,
  onScan,
  onDuplicate,
  onError,
  onStatusChange,
}: UseQuaggaScannerOptions) {
  const quaggaRef = useRef<QuaggaModule | null>(null);
  const runningRef = useRef(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const detectedHandlerRef = useRef<((result: QuaggaDetectedResult) => void) | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAcceptedRef = useRef<{ code: string; at: number } | null>(null);

  const handleDecode = useStableCallback((decodedText: string) => onScan(decodedText));
  const handleDuplicate = useStableCallback((decodedText: string) => onDuplicate?.(decodedText));
  const handleError = useStableCallback((message: string) => onError?.(message));
  const handleStatusChange = useStableCallback((status: QuaggaScanStatus) => onStatusChange?.(status));

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const scheduleScanningStatus = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      handleStatusChange("scanning");
    }, cooldownMs);
  }, [clearResetTimer, cooldownMs, handleStatusChange]);

  const clearTarget = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.innerHTML = "";
    }
  }, []);

  const stop = useCallback(async () => {
    const quagga = quaggaRef.current;

    clearResetTimer();
    lastAcceptedRef.current = null;

    if (quagga && detectedHandlerRef.current) {
      quagga.offDetected(detectedHandlerRef.current);
      detectedHandlerRef.current = null;
    }

    if (runningRef.current && quagga) {
      try {
        quagga.stop();
      } catch {
        // Quagga may already be stopped while React tears down the modal.
      }
    }

    runningRef.current = false;
    clearTarget();
  }, [clearResetTimer, clearTarget]);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    const target = document.getElementById(elementId);
    if (!target) {
      handleStatusChange("error");
      handleError("Scanner region not found");
      return;
    }

    targetRef.current = target;
    lastAcceptedRef.current = null;
    clearTarget();

    try {
      const module = (await import("@ericblade/quagga2")).default;
      quaggaRef.current = module;

      await new Promise<void>((resolve, reject) => {
        module.init(
          {
            inputStream: {
              type: "LiveStream",
              target,
              constraints: {
                facingMode: "environment",
              },
              area: {
                top: "15%",
                right: "10%",
                left: "10%",
                bottom: "15%",
              },
            },
            locator: {
              halfSample: true,
              patchSize: "medium",
            },
            numOfWorkers: Math.max(1, Math.min(4, navigator.hardwareConcurrency ?? 2)),
            frequency: 10,
            decoder: {
              readers: [...READER_TYPES],
              multiple: false,
            },
            locate: true,
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          },
        );
      });

      const handleDetected = (result: QuaggaDetectedResult) => {
        const code = result.codeResult?.code?.trim();
        if (!code) return;

        const now = Date.now();
        const lastAccepted = lastAcceptedRef.current;
        const isDuplicate = lastAccepted?.code === code && now - lastAccepted.at < cooldownMs;

        if (isDuplicate) {
          handleStatusChange("duplicate_ignored");
          handleDuplicate(code);
          scheduleScanningStatus();
          return;
        }

        lastAcceptedRef.current = { code, at: now };
        handleStatusChange("matched");
        handleDecode(code);
        scheduleScanningStatus();
      };

      detectedHandlerRef.current = handleDetected;
      module.onDetected(handleDetected);
      module.start();
      runningRef.current = true;
      handleStatusChange("scanning");
    } catch (error) {
      clearTarget();
      handleStatusChange("error");
      const message = error instanceof Error ? error.message : "Unable to start camera scanner";
      handleError(message);
    }
  }, [clearTarget, cooldownMs, elementId, handleDecode, handleDuplicate, handleError, handleStatusChange, scheduleScanningStatus]);

  useEffect(() => {
    if (enabled) {
      void start();
    } else {
      void stop();
    }

    return () => {
      void stop();
    };
  }, [enabled, start, stop]);

  return { start, stop };
}
