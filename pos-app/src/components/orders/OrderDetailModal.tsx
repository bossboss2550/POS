import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils";
import { Receipt } from "@/components/pos/Receipt";
import { useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import type { Order } from "@/types";

const statusVariant = {
  paid:      "success",
  pending:   "warning",
  cancelled: "error",
  refunded:  "neutral",
} as const;

interface Props { order: Order | null; onClose: () => void; onVoid: (id: string) => void; }

export function OrderDetailModal({ order, onClose, onVoid }: Props) {
  const [showReceipt, setShowReceipt] = useState(false);
  if (!order) return null;

  return (
    <Modal open={!!order} onClose={onClose} title={`Order ${order.orderNumber}`} size="lg">
      {showReceipt ? (
        <Receipt order={order} onClose={() => setShowReceipt(false)} />
      ) : (
        <>
          {/* Order meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Status",   value: <Badge label={order.status} variant={statusVariant[order.status]} /> },
              { label: "Date",     value: formatDate(order.createdAt) },
              { label: "Cashier",  value: order.cashierName },
              { label: "Customer", value: order.customerName ?? "Walk-in" },
              { label: "Payment",  value: order.payment.splits.map(s => s.method.toUpperCase()).join(" + ") },
              { label: "Change",   value: order.payment.change > 0 ? formatCurrency(order.payment.change) : "-" },
            ].map(row => (
              <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{row.label}</p>
                <div className="text-sm font-medium text-gray-800">{row.value}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div className="bg-gray-50 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-500">
                <tr>
                  {["Product","Qty","Unit Price","Discount","Total"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.barcode}</p>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2.5">
                      {item.discount > 0 ? <span className="text-green-600 text-xs">{item.discount}%</span> : "-"}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-5">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span><span className="text-blue-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => setShowReceipt(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            {order.status === "paid" && (
              <button
                onClick={() => { onVoid(order.id); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors ml-auto">
                <RotateCcw className="w-4 h-4" /> Void Order
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
