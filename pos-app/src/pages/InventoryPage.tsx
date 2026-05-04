import { useState, useEffect, useDeferredValue, useCallback } from "react";
import { getServices } from "@/services";
import { formatCurrency, formatDate } from "@/utils";
import { StockAdjustModal } from "@/components/inventory/StockAdjustModal";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Search, SlidersHorizontal, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, Package, History, RefreshCw
} from "lucide-react";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import { CameraScanModal } from "@/components/pos/CameraScanModal";
import { Camera } from "lucide-react";
import type { Product, Category, StockMovement } from "@/types";

type TabType = "stock" | "movements";

export function InventoryPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements]   = useState<StockMovement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<TabType>("stock");
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("all");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const deferredSearch = useDeferredValue(search);
  const { isMobile } = useMobileLayout();
  const [scanOpen, setScanOpen] = useState(false);

  const handleScanAdjust = (barcode: string) => {
    setScanOpen(false);
    const found = products.find(p => p.barcode === barcode);
    if (found) setAdjustTarget(found);
  };

  const load = useCallback(async () => {
    const { productService, inventoryService } = await getServices();
    const [res, cats, movRes] = await Promise.all([
      productService.getProducts({ pageSize: 200 }),
      productService.getCategories(),
      inventoryService.getStockMovements({ pageSize: 50 }),
    ]);
    setProducts(res.data);
    setCategories(cats);
    setMovements(movRes.data);
    setLoading(false);
  }, [setProducts, setCategories, setMovements, setLoading]); // Dependencies

  useEffect(() => {
    setTimeout(() => {
      load();
    }, 0);
  }, [load]);

  const filtered = products.filter(p => {
    const q = deferredSearch.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
    const matchCat    = catFilter === "all" || p.categoryId === catFilter;
    const matchLow    = !showLowOnly || p.stock <= p.minStock;
    return matchSearch && matchCat && matchLow;
  });

  const lowStockCount  = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue     = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const getCatName     = (id: string) => categories.find(c => c.id === id)?.name ?? "—";

  const movementTypeConfig = {
    in:         { icon: ArrowUpCircle,   color: "text-green-600", bg: "bg-green-50",  label: "Stock In"    },
    out:        { icon: ArrowDownCircle, color: "text-red-600",   bg: "bg-red-50",    label: "Stock Out"   },
    adjustment: { icon: SlidersHorizontal, color: "text-blue-600", bg: "bg-blue-50", label: "Adjustment"  },
    transfer:   { icon: RefreshCw,       color: "text-purple-600",bg: "bg-purple-50", label: "Transfer"    },
  } as const;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Products",  value: products.length.toString(),     color: "bg-blue-500",   icon: Package        },
          { label: "Low Stock",       value: lowStockCount.toString(),        color: "bg-orange-500", icon: AlertTriangle  },
          { label: "Out of Stock",    value: outOfStockCount.toString(),      color: "bg-red-500",    icon: AlertTriangle  },
          { label: "Inventory Value", value: formatCurrency(totalValue),      color: "bg-green-500",  icon: Package        },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              {lowStockCount} product{lowStockCount > 1 ? "s" : ""} below minimum stock level
            </p>
            <p className="text-xs text-orange-600 mt-0.5">Review and restock to avoid stockouts</p>
          </div>
          <button onClick={() => setShowLowOnly(true)}
            className="text-xs font-medium text-orange-700 hover:text-orange-900 underline whitespace-nowrap">
            Show only
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "stock" as const,     label: "Stock Levels", icon: Package  },
          { id: "movements" as const, label: "Movement History", icon: History },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "stock" ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-48">
              <Input placeholder="Search products..." prefix={<Search className="w-4 h-4" />}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500" />
              Low stock only
            </label>
          </div>

          {/* Stock table — mobile cards / desktop table */}
          {isMobile ? (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(p => {
                const isLow  = p.stock <= p.minStock && p.stock > 0;
                const isOut  = p.stock === 0;
                const barPct = Math.min(100, (p.stock / Math.max(p.minStock * 3, 1)) * 100);
                return (
                  <div key={p.id}
                    className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${isOut ? "border-red-200 bg-red-50/30" : isLow ? "border-orange-200 bg-orange-50/30" : "border-gray-100"}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isOut ? "bg-red-100" : isLow ? "bg-orange-100" : "bg-green-100"}`}>
                      <Package className={`w-5 h-5 ${isOut ? "text-red-500" : isLow ? "text-orange-500" : "text-green-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>
                        </div>
                        <Badge
                          label={isOut ? "Out of Stock" : isLow ? "Low Stock" : "OK"}
                          variant={isOut ? "error" : isLow ? "warning" : "success"} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isOut ? "bg-red-500" : isLow ? "bg-orange-400" : "bg-green-500"}`}
                            style={{ width: `${barPct}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-900"}`}>
                          {p.stock} / {p.minStock} {p.unit}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{getCatName(p.categoryId)} · Value: {formatCurrency(p.stock * p.cost)}</p>
                    </div>
                    <button onClick={() => setAdjustTarget(p)}
                      className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 shrink-0 transition-colors"
                      aria-label="Adjust stock">
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              <div className="h-20" />
            </div>
          ) : (
<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    {["Product","Category","Barcode","Current Stock","Min Stock","Status","Value","Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const isLow  = p.stock <= p.minStock && p.stock > 0;
                    const isOut  = p.stock === 0;
                    const status = isOut ? "error" : isLow ? "warning" : "success";
                    const statusLabel = isOut ? "Out of Stock" : isLow ? "Low Stock" : "OK";
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 ${isOut ? "bg-red-50/30" : isLow ? "bg-orange-50/30" : ""}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{getCatName(p.categoryId)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.barcode}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Mini stock bar */}
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${isOut ? "bg-red-500" : isLow ? "bg-orange-400" : "bg-green-500"}`}
                                style={{ width: `${Math.min(100, (p.stock / (p.minStock * 3)) * 100)}%` }} />
                            </div>
                            <span className={`font-bold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-900"}`}>
                              {p.stock}
                            </span>
                            <span className="text-gray-400 text-xs">{p.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.minStock} {p.unit}</td>
                        <td className="px-4 py-3"><Badge label={statusLabel} variant={status} /></td>
                        <td className="px-4 py-3 text-gray-700">{formatCurrency(p.stock * p.cost)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setAdjustTarget(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      ) : (
        /* Movement history */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  {["Type","Product","Qty Change","Before","After","Reason","Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map(m => {
                  const cfg = movementTypeConfig[m.type] ?? movementTypeConfig.adjustment;
                  const Icon = cfg.icon;
                  const diff = m.afterStock - m.beforeStock;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {cfg.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{m.productName}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {diff >= 0 ? "+" : ""}{diff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.beforeStock}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{m.afterStock}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.reason}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(m.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StockAdjustModal
        product={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSuccess={() => { setAdjustTarget(null); load(); }}
      />

      {/* Camera scan FAB — mobile inventory */}
      {isMobile && (
        <button onClick={() => setScanOpen(true)}
          className="fixed right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-40"
          style={{ bottom: `calc(4.5rem + env(safe-area-inset-bottom, 0px))` }}
          aria-label="Scan barcode">
          <Camera className="w-6 h-6" />
        </button>
      )}

      <CameraScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={handleScanAdjust}
      />
    </div>
  );
}
