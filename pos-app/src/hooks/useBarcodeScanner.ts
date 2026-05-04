import { useCallback, useEffect, useRef, useLayoutEffect } from "react";
import {
  getBarcodeCharacterFromEvent,
  getEditableTextTarget,
  restoreEditableValue,
} from "@/utils/barcodeKeyboard";

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

interface UseBarcodeScannerOptions {
  minLength?: number;
  timeout?: number;
  enabled?: boolean;
  maxInterKeyDelay?: number;
}

interface SequenceState {
  buffer: string;
  lastEventAt: number;
  isScannerSequence: boolean;
  editableTarget: HTMLInputElement | HTMLTextAreaElement | null;
  editableInitialValue: string;
  restoredEditableValue: boolean;
}

const DEFAULT_SEQUENCE_STATE: SequenceState = {
  buffer: "",
  lastEventAt: 0,
  isScannerSequence: false,
  editableTarget: null,
  editableInitialValue: "",
  restoredEditableValue: false,
};

/** Listens for USB/Bluetooth HID barcode scanners via layout-independent keyboard events. */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: UseBarcodeScannerOptions = {},
) {
  const {
    minLength = 4,
    timeout = 80,
    enabled = true,
    maxInterKeyDelay = 35,
  } = options;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef<SequenceState>(DEFAULT_SEQUENCE_STATE);
  const handleScan = useStableCallback((barcode: string) => onScan(barcode));

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const clearTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    const resetSequence = () => {
      sequence.current = {
        buffer: "",
        lastEventAt: 0,
        isScannerSequence: false,
        editableTarget: null,
        editableInitialValue: "",
        restoredEditableValue: false,
      };
    };

    const flush = () => {
      clearTimer();
      const { buffer, isScannerSequence } = sequence.current;
      const barcode = buffer.trim();
      resetSequence();

      if (isScannerSequence && barcode.length >= minLength) {
        handleScan(barcode);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        return;
      }

      if (event.key === "Enter") {
        if (sequence.current.isScannerSequence) {
          event.preventDefault();
        }
        flush();
        return;
      }

      const character = getBarcodeCharacterFromEvent(event);
      if (!character) {
        return;
      }

      const now = performance.now();
      const activeSequence = sequence.current;
      const gap = activeSequence.lastEventAt ? now - activeSequence.lastEventAt : 0;
      const shouldStartNewSequence = !activeSequence.buffer || gap > maxInterKeyDelay;

      if (shouldStartNewSequence) {
        const editableTarget = getEditableTextTarget(event.target);
        sequence.current = {
          buffer: character,
          lastEventAt: now,
          isScannerSequence: false,
          editableTarget,
          editableInitialValue: editableTarget?.value ?? "",
          restoredEditableValue: false,
        };
      } else {
        activeSequence.buffer += character;
        activeSequence.lastEventAt = now;
        activeSequence.isScannerSequence = true;

        if (activeSequence.editableTarget && !activeSequence.restoredEditableValue) {
          restoreEditableValue(activeSequence.editableTarget, activeSequence.editableInitialValue);
          activeSequence.restoredEditableValue = true;
        }
      }

      if (sequence.current.isScannerSequence) {
        event.preventDefault();
      }

      clearTimer();
      timer.current = setTimeout(flush, timeout);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimer();
      resetSequence();
    };
  }, [enabled, handleScan, maxInterKeyDelay, minLength, timeout]);
}
