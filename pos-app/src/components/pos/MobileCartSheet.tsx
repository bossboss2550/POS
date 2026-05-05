import { useCartStore } from "@/stores/cartStore";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useTranslation } from "react-i18next";
import { CustomerSearch } from "./CustomerSearch";
import { CouponInput } from "./CouponInput";
import { formatCurrency } from "@/utils";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Tag, ChevronUp, X, Pause, List } from "lucide-react";

interface Props {
  onCheckout: () => void;
  onHoldCart?: () => void;
  onViewHeld?: () => void;
}

export function MobileCartSheet({ onCheckout, onHoldCart, onViewHeld }: Props) {
  const { t } = useTranslation();
  const cart = useCartStore();
  const { snap, isOpen, open, close, sheetProps } = useBottomSheet({ defaultSnap: "closed" });
  const count = cart.itemCount();

  return (
    <>
      {/* FAB cart trigger */}
      <button
        onClick={() => open("full")}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
        aria-label="Open cart"
      >
        <ShoppingCart className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={close} />
      )}

      {/* Bottom sheet */}
      <div
        {...sheetProps}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          ...sheetProps.style,
          paddingBottom: "env(safe-area-inset-bottom)",
          maxHeight: "92dvh",
        }}
      >
        {/* Drag handle + header */}
        <div className="flex-shrink-0">
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">Cart</span>
              {count > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{count}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cart.items.length > 0 && (
                <button onClick={cart.clearCart}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1">Clear all</button>
              )}
              <button onClick={() => snap === "full" ? open("half") : open("full")}
                className="p-1 text-gray-400">
                <ChevronUp className={`w-5 h-5 transition-transform ${snap === "full" ? "rotate-180" : ""}`} />
              </button>
              <button onClick={close} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Customer selector */}
          <div className="px-4 py-2 border-b border-gray-50">
            <CustomerSearch selected={cart.customer} onSelect={cart.setCustomer} />
          </div>

          {/* Hold Bills & View Held buttons */}
          <div className="px-4 py-2 border-b border-gray-50 flex gap-2">
            <button
              onClick={() => { close(); onHoldCart?.(); }}
              disabled={cart.items.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <Pause className="w-4 h-4" />
              {t("pos.holdBills")}
            </button>
            <button
              onClick={() => { close(); onViewHeld?.(); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium relative active:scale-95 transition-all"
            >
              <List className="w-4 h-4" />
              {cart.savedCarts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cart.savedCarts.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Cart items — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <ShoppingCart className="w-14 h-14 mb-3 opacity-40" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Tap products or scan to add items</p>
            </div>
          ) : (
            cart.items.map(item => (
              <MobileCartItem key={item.product.id} item={item} />
            ))
          )}
        </div>

        {/* Coupon + Totals + Checkout — sticky footer */}
        {cart.items.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 pt-3 pb-2 space-y-3 bg-white">
            <CouponInput />

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(cart.subtotal())}</span>
              </div>
              {cart.discountAmount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>−{formatCurrency(cart.discountAmount())}</span>
                </div>
              )}
              {cart.taxEnabled && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax ({cart.taxRate * 100}%)</span><span>{formatCurrency(cart.taxAmount())}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => { close(); onCheckout(); }}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <CreditCard className="w-5 h-5" />
              Pay {formatCurrency(cart.total())}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Individual cart item with swipe-to-delete
function MobileCartItem({ item }: { item: ReturnType<typeof useCartStore.getState>["items"][0] }) {
  const cart = useCartStore();
  const { onTouchStart, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: () => cart.removeItem(item.product.id),
  });

  return (
    <div
      className="bg-gray-50 rounded-2xl p-3 active:bg-red-50 transition-colors"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</span>
          </div>
        </div>
        <button onClick={() => cart.removeItem(item.product.id)}
          className="p-1 text-gray-300 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {/* Qty stepper — large touch targets */}
        <div className="flex items-center gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-base font-bold text-gray-800">{item.quantity}</span>
          <button
            onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Item discount badge */}
        {item.discount > 0 && (
          <span className="text-xs text-green-600 font-medium">−{item.discount}%</span>
        )}

        <span className="text-base font-bold text-blue-600">{formatCurrency(item.total)}</span>
      </div>
    </div>
  );
}
