import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency, formatDate } from "@/utils";
import { useState } from "react";
import { ShoppingBag, Trash2, CornerDownLeft, User } from "lucide-react";
import type { SavedCart } from "@/stores/cartStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HeldCartsModal({ open, onClose }: Props) {
  const { savedCarts, recallCart, deleteHeldCart } = useCartStore();
  const [deleteTarget, setDeleteTarget] = useState<SavedCart | null>(null);

  const handleRecall = (id: string) => {
    recallCart(id);
    onClose();
  };

  if (savedCarts.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title="Held Carts" size="md">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No held carts</p>
          <p className="text-sm mt-1">Hold a cart from the POS screen to save it here.</p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Held Carts (${savedCarts.length})`} size="md">
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Recalling a cart will replace the current cart.</p>
          {savedCarts.map(cart => (
            <div key={cart.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{cart.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(cart.savedAt)}</p>
                  {cart.customer && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                      <User className="w-3 h-3" />
                      {cart.customer.name}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatCurrency(
                    cart.items.reduce((s, i) => s + i.total, 0) * (1 - cart.orderDiscount / 100)
                  )}</p>
                  <p className="text-xs text-gray-400">{cart.items.length} item{cart.items.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Items preview */}
              <div className="mt-3 space-y-1">
                {cart.items.slice(0, 3).map(item => (
                  <div key={item.product.id} className="flex justify-between text-xs text-gray-500">
                    <span className="truncate">{item.quantity}× {item.product.name}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <p className="text-xs text-gray-400">+{cart.items.length - 3} more items</p>
                )}
              </div>

              {cart.note && (
                <p className="mt-2 text-xs text-gray-400 italic truncate">Note: {cart.note}</p>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => handleRecall(cart.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                  <CornerDownLeft className="w-3.5 h-3.5" /> Recall Cart
                </button>
                <button onClick={() => setDeleteTarget(cart)}
                  className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Held Cart"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        danger
        onConfirm={() => { if (deleteTarget) { deleteHeldCart(deleteTarget.id); setDeleteTarget(null); } }}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

