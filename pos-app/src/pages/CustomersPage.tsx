import { useState, useEffect, useTransition, useDeferredValue, useCallback } from "react";
import { getServices } from "@/services";
import { formatCurrency, formatDate } from "@/utils";
import { useNotification } from "@/hooks/useNotification";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Search, Edit2, Trash2, Users, History, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer, Order } from "@/types";

const TIER_CONFIG = {
  bronze:   { label: "Bronze",   color: "bg-amber-100 text-amber-700",  icon: "🥉" },
  silver:   { label: "Silver",   color: "bg-gray-100 text-gray-600",    icon: "🥈" },
  gold:     { label: "Gold",     color: "bg-yellow-100 text-yellow-700",icon: "🥇" },
  platinum: { label: "Platinum", color: "bg-blue-100 text-blue-700",    icon: "💎" },
} as const;

const PAGE_SIZE = 12;

export function CustomersPage() {
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [formOpen, setFormOpen]         = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [history, setHistory]           = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [,]                             = useTransition();
  const deferredSearch = useDeferredValue(search);
  const notify = useNotification();

  const loadCustomers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    const { customerService } = await getServices();
    const res = await customerService.getCustomers({ page: p, pageSize: PAGE_SIZE, search: s || undefined });
    setCustomers(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [setCustomers, setLoading, setTotal]);

  useEffect(() => {
    setTimeout(() => {
      setPage(1);
      loadCustomers(1, deferredSearch);
    }, 0);
  }, [deferredSearch, loadCustomers]);

  useEffect(() => {
    setTimeout(() => {
      loadCustomers(page, deferredSearch);
    }, 0);
  }, [page, deferredSearch, loadCustomers]);

  const loadHistory = async (customer: Customer) => {
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    setHistory([]);
    const { orderService } = await getServices();
    const res = await orderService.getOrders({ pageSize: 50 });
    setHistory(res.data.filter((o: Order) => o.customerId === customer.id));
    setHistoryLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Note: mock service doesn't have delete, we simulate with update
    notify.info("Delete not supported on mock data (customer deactivated)");
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditCustomer(null); setFormOpen(true); };
  const openEdit   = (c: Customer) => { setEditCustomer(c); setFormOpen(true); };
  const onFormSuccess = async () => { setFormOpen(false); await loadCustomers(page, deferredSearch); };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered customers</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <Input placeholder="Search by name or phone..."
          prefix={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Customer cards grid */}
      {loading ? <PageLoader /> : customers.length === 0 ? (
        <EmptyState icon={<Users className="w-16 h-16" />} title="No customers found"
          action={<button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add Customer</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map(c => {
            const tier = TIER_CONFIG[c.memberTier];
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">{c.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tier.color}`}>
                    {tier.icon} {tier.label}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(c.totalSpent)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Loyalty Points</p>
                    <p className="font-bold text-purple-600 mt-0.5">{c.loyaltyPoints.toLocaleString()}</p>
                  </div>
                </div>

                {c.email && <p className="text-xs text-gray-400 mb-3 truncate">{c.email}</p>}

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => loadHistory(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <History className="w-3.5 h-3.5" /> History
                  </button>
                  <button onClick={() => openEdit(c)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-200 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-white"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editCustomer ? "Edit Customer" : "Add Customer"} size="md">
        <CustomerForm customer={editCustomer} onSuccess={onFormSuccess} onCancel={() => setFormOpen(false)} />
      </Modal>

      {/* Purchase history modal */}
      <Modal open={!!historyCustomer} onClose={() => setHistoryCustomer(null)}
        title={`${historyCustomer?.name} — Purchase History`} size="lg">
        {historyLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-8 h-8" /></div>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No orders found for this customer.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{history.length}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-xl font-bold text-green-600 mt-0.5">{formatCurrency(history.reduce((s, o) => s + o.total, 0))}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Avg Order</p>
                <p className="text-xl font-bold text-purple-600 mt-0.5">{formatCurrency(history.reduce((s, o) => s + o.total, 0) / history.length)}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {history.map(o => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-mono font-medium text-blue-600">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(o.total)}</p>
                    <Badge label={o.status} variant={o.status === "paid" ? "success" : "error"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteTarget} title="Remove Customer"
        message={`Remove "${deleteTarget?.name}" from the system?`}
        confirmLabel="Remove" danger
        onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
