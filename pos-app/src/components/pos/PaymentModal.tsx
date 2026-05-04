import { useState, useTransition } from "react";
import { CreditCard, Banknote, QrCode, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotification } from "@/hooks/useNotification";
import { getServices } from "@/services";
import { formatCurrency, calculateChange, roundCurrency } from "@/utils";
import { Receipt } from "./Receipt";
import type { Order, PaymentMethod } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const methods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "qr", label: "QR Pay", icon: QrCode },
  { id: "transfer", label: "Transfer", icon: CreditCard },
];

const QUICK_AMOUNTS = [20, 50, 100, 500, 1000];

export function PaymentModal({ open, onClose }: Props) {
  const cart = useCartStore();
  const { user } = useAuthStore();
  const notify = useNotification();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = roundCurrency(cart.total());
  const tenderedNum = roundCurrency(parseFloat(tendered) || 0);
  const change = method === "cash" ? calculateChange(tenderedNum, total) : 0;
  const canPay = method !== "cash" || tenderedNum >= total;

  const handlePay = () => {
    if (!canPay) {
      return;
    }

    startTransition(async () => {
      try {
        const { orderService } = await getServices();
        const order = await orderService.createOrder({
          items: cart.items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          })),
          customerId: cart.customer?.id,
          customerName: cart.customer?.name,
          cashierId: user!.id,
          cashierName: user!.name,
          subtotal: cart.subtotal(),
          discountAmount: cart.discountAmount(),
          taxAmount: cart.taxAmount(),
          total,
          payment: {
            id: `pay-${Date.now()}`,
            orderId: "",
            splits: [{ method, amount: method === "cash" ? tenderedNum : total }],
            total,
            change,
            createdAt: new Date().toISOString(),
          },
          note: cart.note,
          status: "paid" as const,
        });

        cart.clearCart();
        setCompletedOrder(order);
        notify.success("Payment successful!");
      } catch (err: any) {
        const apiMsg = err.response?.data?.message;
        const msg = Array.isArray(apiMsg)
          ? apiMsg.join(", ")
          : apiMsg ?? err.message ?? "Payment failed";
        notify.error(msg);
      }
    });
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setTendered("");
    setMethod("cash");
    onClose();
  };

  if (completedOrder) {
    return (
      <Modal open={open} onClose={handleClose} title="Payment Successful" size="sm">
        <div className="mb-4 flex flex-col items-center gap-2">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-bold text-gray-900">{formatCurrency(completedOrder.total)}</p>
          <p className="text-sm text-gray-500">Order {completedOrder.orderNumber}</p>
        </div>
        <Receipt order={completedOrder} onClose={handleClose} />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Payment" size="md">
      <div className="mb-5 space-y-1 rounded-xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(cart.subtotal())}</span>
        </div>
        {cart.discountAmount() > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({cart.orderDiscount}%)</span>
            <span>-{formatCurrency(cart.discountAmount())}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Tax (7%)</span>
          <span>{formatCurrency(cart.taxAmount())}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 text-lg font-bold text-gray-900">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-3 text-sm font-medium text-gray-700">Payment Method</p>
        <div className="grid grid-cols-4 gap-2">
          {methods.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setMethod(entry.id);
                  setTendered("");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all ${
                  method === entry.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      {method === "cash" && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-gray-700">Cash Received</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-500">฿</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={tendered}
              onChange={(event) => setTendered(event.target.value)}
              placeholder={total.toFixed(2)}
              className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="mt-2 flex gap-2">
            {QUICK_AMOUNTS.filter((amount) => amount >= total || amount === Math.ceil(total / 100) * 100).slice(0, 4).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setTendered(amount.toString())}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                ฿{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTendered(total.toFixed(2))}
              className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              Exact
            </button>
          </div>

          {tenderedNum > 0 && (
            <div
              className={`mt-3 flex items-center justify-between rounded-xl p-3 text-sm font-medium ${
                change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <span>{change >= 0 ? "Change" : "Insufficient"}</span>
              <span className="text-base font-bold">{formatCurrency(Math.abs(change))}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!canPay || isPending}
        className="w-full rounded-xl bg-green-600 py-3.5 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Processing..." : `Pay ${formatCurrency(total)}`}
      </button>
    </Modal>
  );
}
