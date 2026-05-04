import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-100" : "bg-yellow-100"}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? "text-red-600" : "text-yellow-600"}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
