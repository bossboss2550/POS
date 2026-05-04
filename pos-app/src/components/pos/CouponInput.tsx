import { useState, useTransition } from "react";
import { useCartStore } from "@/stores/cartStore";
import { usePromotionStore } from "@/stores/promotionStore";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency } from "@/utils";
import { Tag, X, CheckCircle2, Loader2 } from "lucide-react";

export function CouponInput() {
  const [code, setCode]     = useState("");
  const [isPending, start]  = useTransition();
  const cart                = useCartStore();
  const promo               = usePromotionStore();
  const notify              = useNotification();

  const subtotal = cart.subtotal() - cart.discountAmount() + cart.couponDiscount;
  const isApplied = !!cart.couponCode;

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    start(async () => {
      // Simulate brief async validation (real API call when using real services)
      await new Promise(r => setTimeout(r, 300));

      const result = promo.validateCoupon(trimmed, subtotal);
      if (result.valid && result.promo) {
        cart.setCoupon(trimmed, result.discount);
        promo.usePromo(result.promo.id);
        notify.success(`Coupon applied: ${result.message} (−${formatCurrency(result.discount)})`);
        setCode("");
      } else {
        notify.error(result.message);
      }
    });
  };

  const handleRemove = () => {
    cart.removeCoupon();
    notify.info("Coupon removed");
  };

  if (isApplied) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-green-600" />
            <span className="text-xs font-mono font-semibold text-green-700">{cart.couponCode}</span>
          </div>
          <p className="text-xs text-green-600">−{formatCurrency(cart.couponDiscount)} applied</p>
        </div>
        <button onClick={handleRemove} className="text-green-400 hover:text-green-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleApply()}
          placeholder="Coupon code"
          className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
        />
      </div>
      <button
        onClick={handleApply}
        disabled={isPending || !code.trim()}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
      </button>
    </div>
  );
}
