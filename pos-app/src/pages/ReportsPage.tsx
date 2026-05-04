import { useState, useEffect } from "react";
import { usePrint } from "@/hooks/usePrint";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { getServices } from "@/services";
import { formatCurrency, formatDate } from "@/utils";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, ShoppingCart, Users, Package, Download, Calendar } from "lucide-react";
import type { DashboardSummary, Order } from "@/types";

type Range = "today" | "week" | "month";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function exportCSV(orders: Order[], range: Range) {
  const headers = ["Order #","Date","Customer","Items","Subtotal","Discount","Tax","Total","Payment","Status"];
  const rows = orders.map(o => [
    o.orderNumber, formatDate(o.createdAt),
    o.customerName ?? "Walk-in",
    o.items.length, o.subtotal.toFixed(2), o.discountAmount.toFixed(2),
    o.taxAmount.toFixed(2), o.total.toFixed(2),
    o.payment?.splits?.[0]?.method ?? "cash", o.status
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `sales_${range}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [summary, setSummary]     = useState<DashboardSummary | null>(null);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [range, setRange]         = useState<Range>("week");
  const [loading, setLoading]     = useState(true);
  const { contentRef: reportRef, print: printReport } = usePrint<HTMLDivElement>({
    documentTitle: `POS Sales Report - ${range}`,
  });

  useEffect(() => {
    // Defer setLoading(true) to avoid synchronous setState in effect
    setTimeout(() => setLoading(true), 0);
    (async () => {
      const { reportService, orderService } = await getServices();
      const [sum, ord] = await Promise.all([
        reportService.getDashboard(),
        orderService.getOrders({ pageSize: 200, status: "paid" }),
      ]);
      setSummary(sum);
      setOrders(ord.data);
      setLoading(false);
    })();
  }, [range]);

  if (loading || !summary) return <PageLoader />;

  // Category revenue from orders (group by product name initial letter as proxy)
  const catMap: Record<string, number> = {};
  summary.topProducts.forEach(p => {
    const cat = p.productName.charAt(0).toUpperCase();
    catMap[cat] = (catMap[cat] ?? 0) + p.revenue;
  });
  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Payment method breakdown
  const pmMap: Record<string, number> = {};
  orders.forEach(o => {
    const method = o.payment?.splits?.[0]?.method ?? "cash";
    pmMap[method] = (pmMap[method] ?? 0) + o.total;
  });
  const pmData = Object.entries(pmMap).map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: "Total Revenue",  value: formatCurrency(summary.todaySales),          icon: TrendingUp,  color: "bg-blue-500"   },
    { label: "Orders",         value: summary.todayOrders.toLocaleString(),         icon: ShoppingCart,color: "bg-green-500"  },
    { label: "Active Customers",value: summary.activeCustomers.toLocaleString(),   icon: Users,       color: "bg-purple-500" },
    { label: "Low Stock Items",value: summary.lowStockCount.toLocaleString(),       icon: Package,     color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sales performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {(["today","week","month"] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
          <button onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm no-print">
            <Download className="w-4 h-4" /> Print / PDF
          </button>
          <button onClick={() => exportCSV(orders, range)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className={`w-9 h-9 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Sales trend chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Sales Trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={summary.salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v as number)} width={70} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Area type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Top Products by Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.topProducts.slice(0, 7).map(p => ({ name: p.productName, revenue: p.revenue }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `฿${(v as number / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category revenue pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="45%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend iconSize={10} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">No data for this period</p>
          )}
        </div>
      </div>

      {/* Payment method breakdown */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Payment Method Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pmData.map((pm, i) => (
            <div key={pm.name} className="rounded-xl p-4 text-center"
              style={{ backgroundColor: COLORS[i % COLORS.length] + "18", borderColor: COLORS[i % COLORS.length] + "40", borderWidth: 1 }}>
              <p className="text-sm font-medium text-gray-700 capitalize">{pm.name}</p>
              <p className="text-xl font-bold mt-1" style={{ color: COLORS[i % COLORS.length] }}>{formatCurrency(pm.value)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {((pm.value / pmData.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden printable report — off-screen, triggered by usePrint */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {summary && <PrintableReport ref={reportRef} summary={summary} range={range} />}
      </div>
    </div>
  );
}
