import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useSettingsStore } from "@/stores/settingsStore";
import { formatCurrency, formatDate } from "@/utils";
import { Printer, Download } from "lucide-react";
import type { Order } from "@/types";

interface Props { order: Order; onClose: () => void; }

export function Receipt({ order, onClose }: Props) {
  const { settings } = useSettingsStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${order.orderNumber}`,
  });

  const payMethod = (order.payment?.splits ?? []).map(s => s.method.toUpperCase()).join(" + ") || "—";

  return (
    <div className="flex flex-col gap-4">
      {/* Receipt preview */}
      <div ref={receiptRef} className="bg-white border border-dashed border-gray-300 rounded-lg p-6 font-mono text-sm max-w-xs mx-auto w-full">
        {/* Store header */}
        <div className="text-center mb-4">
          <p className="font-bold text-lg">{settings.storeName}</p>
          <p className="text-xs text-gray-600">{settings.address}</p>
          <p className="text-xs text-gray-600">Tel: {settings.phone}</p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Order info */}
        <div className="text-xs space-y-0.5 mb-3">
          <div className="flex justify-between">
            <span>Order:</span><span>{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span><span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span><span>{order.cashierName}</span>
          </div>
          {order.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span><span>{order.customerName}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Items */}
        <div className="space-y-1 text-xs mb-3">
          {order.items.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <span className="flex-1 truncate">{item.productName}</span>
                <span className="ml-2">{formatCurrency(item.total)}</span>
              </div>
              <div className="text-gray-500 pl-2">
                {item.quantity} x {formatCurrency(item.unitPrice)}
                {item.discount > 0 && ` (-${item.discount}%)`}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Totals */}
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span>Tax (7%)</span><span>{formatCurrency(order.taxAmount)}</span></div>
          <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-dashed border-gray-400">
            <span>TOTAL</span><span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between mt-1"><span>Payment</span><span>{payMethod}</span></div>
          {order.payment.change > 0 && (
            <div className="flex justify-between text-green-600"><span>Change</span><span>{formatCurrency(order.payment.change)}</span></div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 my-3" />
        <p className="text-center text-xs text-gray-500">{settings.receiptFooter}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
        <button onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Done
        </button>
      </div>
    </div>
  );
}
