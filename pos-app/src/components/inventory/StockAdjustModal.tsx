import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import { ArrowUpCircle, ArrowDownCircle, SlidersHorizontal } from "lucide-react";
import type { Product, StockMovementType } from "@/types";

interface Props {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MOVEMENT_TYPES: { id: StockMovementType; label: string; icon: typeof ArrowUpCircle; color: string; desc: string }[] = [
  { id: "in",         label: "Add Stock",   icon: ArrowUpCircle,      color: "text-green-600 border-green-300 bg-green-50",   desc: "Receive stock from supplier" },
  { id: "out",        label: "Remove Stock",icon: ArrowDownCircle,    color: "text-red-600 border-red-300 bg-red-50",         desc: "Damaged, expired, or used" },
  { id: "adjustment", label: "Adjustment",  icon: SlidersHorizontal,  color: "text-blue-600 border-blue-300 bg-blue-50",      desc: "Manual count correction" },
];

const PRESET_REASONS: Record<StockMovementType, string[]> = {
  in:         ["Restock from supplier", "Purchase order received", "Return from customer"],
  out:        ["Damaged goods", "Expired product", "Internal use"],
  adjustment: ["Stocktake correction", "System error fix", "Opening balance"],
  transfer:   ["Branch transfer"],
};

export function StockAdjustModal({ product, onClose, onSuccess }: Props) {
  const [type, setType]       = useState<StockMovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason]   = useState("");
  const [isPending, startTransition] = useTransition();
  const notify = useNotification();

  if (!product) return null;

  const afterStock = (() => {
    const qty = parseInt(quantity) || 0;
    if (type === "in")         return product.stock + qty;
    if (type === "out")        return Math.max(0, product.stock - qty);
    if (type === "adjustment") return qty;
    return product.stock;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0)  { notify.error("Enter a valid quantity"); return; }
    if (!reason.trim())    { notify.error("Reason is required"); return; }

    startTransition(async () => {
      try {
        const { inventoryService } = await getServices();
        await inventoryService.adjustStock(product.id, qty, type, reason);
        notify.success(`Stock updated: ${product.name}`);
        onSuccess();
        onClose();
      } catch (err: any) {
        notify.error(err.message ?? "Failed to adjust stock");
      }
    });
  };

  return (
    <Modal open={!!product} onClose={onClose} title="Stock Adjustment" size="md">
      {/* Product info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="font-semibold text-gray-900">{product.name}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-sm text-gray-500">Current stock: <strong className={`${product.stock <= product.minStock ? "text-red-600" : "text-gray-800"}`}>{product.stock} {product.unit}</strong></span>
          <span className="text-sm text-gray-500">Min: {product.minStock}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Movement type */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Movement Type</p>
          <div className="grid grid-cols-3 gap-2">
            {MOVEMENT_TYPES.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} type="button"
                  onClick={() => { setType(m.id); setReason(""); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    type === m.id ? m.color + " border-current" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {MOVEMENT_TYPES.find(m => m.id === type)?.desc}
          </p>
        </div>

        {/* Quantity */}
        <Input
          label={type === "adjustment" ? "Set stock to *" : "Quantity *"}
          type="number" min={1}
          placeholder={type === "adjustment" ? `Current: ${product.stock}` : "Enter quantity"}
          value={quantity} onChange={e => setQuantity(e.target.value)}
        />

        {/* Preview */}
        {quantity && parseInt(quantity) > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <span className="text-gray-600">After adjustment:</span>
            <span className={`font-bold text-lg ${afterStock <= product.minStock ? "text-red-600" : "text-blue-700"}`}>
              {afterStock} {product.unit}
            </span>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
          <select
            value={reason} onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          >
            <option value="">— Select a reason —</option>
            {PRESET_REASONS[type].map(r => <option key={r} value={r}>{r}</option>)}
            <option value="__custom__">Other (type below)</option>
          </select>
          {(reason === "__custom__" || !PRESET_REASONS[type].includes(reason)) && reason !== "" && (
            <input type="text" placeholder="Describe the reason..."
              value={reason === "__custom__" ? "" : reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {isPending ? "Saving..." : "Apply Adjustment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
