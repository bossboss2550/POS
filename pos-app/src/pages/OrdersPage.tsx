import { useState, useEffect, useTransition, useCallback } from "react";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency, formatDate } from "@/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { Search, ClipboardList, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "paid",      label: "Paid" },
  { value: "pending",   label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded",  label: "Refunded" },
];

const statusVariant = {
  paid:      "success",
  pending:   "warning",
  cancelled: "error",
  refunded:  "neutral",
} as const;

const PAGE_SIZE = 15;

export function OrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [voidTarget, setVoidTarget]   = useState<string | null>(null);
  const [, startTransition]           = useTransition();
  const notify = useNotification();

  const loadOrders = useCallback(async (p: number, s: string, st: OrderStatus | "all") => {
    setLoading(true);
    const { orderService } = await getServices();
    const res = await orderService.getOrders({
      page: p, pageSize: PAGE_SIZE,
      search: s || undefined,
      status: st === "all" ? undefined : st,
    });
    setOrders(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [setOrders, setLoading, setTotal]);

  useEffect(() => {
    setTimeout(() => {
      loadOrders(page, search, statusFilter);
    }, 0);
  }, [page, search, statusFilter, loadOrders]);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusChange = (v: OrderStatus | "all") => { setStatusFilter(v); setPage(1); };

  const handleVoid = (id: string) => { setVoidTarget(id); };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    startTransition(async () => {
      const { orderService } = await getServices();
      await orderService.updateOrderStatus(voidTarget, "cancelled");
      notify.success("Order voided successfully");
      setVoidTarget(null);
      loadOrders(page, search, statusFilter);
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search by order # or customer..."
            prefix={<Search className="w-4 h-4" />}
            value={search} onChange={e => handleSearchChange(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex gap-1">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-8 h-8" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ClipboardList className="w-16 h-16" />} title="No orders found"
            description="Try adjusting your filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    {["Order #","Customer","Cashier","Items","Subtotal","Tax","Total","Payment","Status","Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{order.customerName ?? <span className="text-gray-400 italic">Walk-in</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{order.cashierName}</td>
                      <td className="px-4 py-3 text-gray-500">{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(order.subtotal)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatCurrency(order.taxAmount)}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-gray-600 text-xs">
                          {order.payment?.splits?.map(s => s.method).join("+") ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={order.status} variant={statusVariant[order.status]} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} · {total} orders
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onVoid={handleVoid} />

      <ConfirmDialog
        open={!!voidTarget}
        title="Void Order"
        message="Are you sure you want to void this order? This action cannot be undone."
        confirmLabel="Void Order"
        danger
        onConfirm={confirmVoid}
        onClose={() => setVoidTarget(null)}
      />
    </div>
  );
}
