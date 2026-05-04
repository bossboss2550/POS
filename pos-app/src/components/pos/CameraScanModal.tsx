import { useState, useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { useQuaggaScanner, type QuaggaScanStatus } from "@/hooks/useQuaggaScanner";
import { Camera, CheckCircle2, ShieldAlert, ZapOff } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function CameraScanModal({ open, onClose, onScan }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [status, setStatus] = useState<QuaggaScanStatus>("scanning");
  const containerId = useId().replace(/:/g, "");
  const regionId = `scan-${containerId}`;

  useQuaggaScanner({
    elementId: regionId,
    enabled: open,
    cooldownMs: 1500,
    onScan: (barcode) => {
      setError(null);
      setLastScan(barcode);
      onScan(barcode);
    },
    onDuplicate: (barcode) => {
      setError(null);
      setLastScan(barcode);
    },
    onStatusChange: setStatus,
    onError: (message) => {
      setStatus("error");
      setError(message);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Camera Barcode Scanner" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Point the camera at a product barcode and hold it steady inside the frame.
        </p>

        <div className="relative overflow-hidden rounded-xl bg-gray-900">
          <div id={regionId} className="w-full h-80 md:h-96 lg:h-112" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-56 rounded-lg border-2 border-blue-400 opacity-70">
              <div className="absolute left-0 top-0 h-5 w-5 rounded-tl border-l-4 border-t-4 border-blue-400" />
              <div className="absolute right-0 top-0 h-5 w-5 rounded-tr border-r-4 border-t-4 border-blue-400" />
              <div className="absolute bottom-0 left-0 h-5 w-5 rounded-bl border-b-4 border-l-4 border-blue-400" />
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-br border-b-4 border-r-4 border-blue-400" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <ZapOff className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">Camera Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        ) : status === "matched" ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700">Barcode added</p>
              {lastScan && (
                <p className="text-xs text-green-600">
                  Added: <code className="font-mono">{lastScan}</code>
                </p>
              )}
            </div>
          </div>
        ) : status === "duplicate_ignored" ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-700">Duplicate scan ignored</p>
              {lastScan && (
                <p className="text-xs text-amber-600">
                  Waiting before scanning <code className="font-mono">{lastScan}</code> again.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <Camera className="h-5 w-5 shrink-0 animate-pulse text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-700">Scanning barcode...</p>
              {lastScan && (
                <p className="text-xs text-blue-600">
                  Last scan: <code className="font-mono">{lastScan}</code>
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close Scanner
        </button>
      </div>
    </Modal>
  );
}
