import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/utils";
import { Delete } from "lucide-react";
import type { Product } from "@/types";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function QuickNumpad({ product, onClose }: Props) {
  const [qty, setQty] = useState("1");
  const cart = useCartStore();

  if (!product) return null;

  const append = (digit: string) => {
    if (qty === "0" || qty === "1" && digit !== "0") setQty(digit);
    else if (qty.length < 3) setQty(q => q + digit);
  };

  const backspace = () => setQty(q => q.length > 1 ? q.slice(0, -1) : "1");

  const confirm = () => {
    const n = parseInt(qty) || 1;
    cart.addItem(product, n);
    onClose();
  };

  const numKeys = ["1","2","3","4","5","6","7","8","9","00","0"];

  return (
    <Modal open={!!product} onClose={onClose} title="Add to Cart" size="sm">
      {/* Product preview */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 text-center">
        <p className="font-semibold text-gray-900 truncate">{product.name}</p>
        <p className="text-blue-600 font-bold text-lg">{formatCurrency(product.price)}</p>
      </div>

      {/* Display */}
      <div className="bg-gray-50 rounded-xl py-4 text-center mb-4">
        <p className="text-4xl font-bold text-gray-900 tabular-nums">{qty}</p>
        <p className="text-xs text-gray-400 mt-1">
          = {formatCurrency(product.price * (parseInt(qty) || 1))}
        </p>
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {numKeys.map(k => (
          <button key={k} onClick={() => append(k)}
            className="h-14 bg-white border border-gray-200 rounded-xl text-xl font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 transition-transform shadow-sm">
            {k}
          </button>
        ))}
        <button onClick={backspace}
          className="h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform shadow-sm">
          <Delete className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <button onClick={confirm}
        className="w-full h-14 bg-blue-600 text-white rounded-2xl text-base font-bold hover:bg-blue-700 active:scale-98 transition-transform">
        Add {qty} to Cart
      </button>
    </Modal>
  );
}
