import { useEffect, useState } from "react";
import { getServices } from "@/services";
import { formatCurrency, formatDate } from "@/utils";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingBag, AlertTriangle, Users } from "lucide-react";
import type { DashboardSummary } from "@/types";

export function DashboardPage() {
  const [data, setData]     = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { reportService } = await getServices();
      const summary = await reportService.getDashboard();
      if (!cancelled) { setData(summary); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageLoader />;
  if (!data)   return null;

  const statCards = [
    { label: "Today Sales",     value: formatCurrency(data.todaySales),  icon: TrendingUp,     color: "bg-blue-500" },
    { label: "Today Orders",    value: data.todayOrders.toString(),        icon: ShoppingBag,    color: "bg-green-500" },
    { label: "Low Stock Items", value: data.lowStockCount.toString(),      icon: AlertTriangle,  color: "bg-orange-500" },
    { label: "Customers",       value: data.activeCustomers.toString(),    icon: Users,          color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">7-Day Sales Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.salesTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Sales"]} />
              <Area type="monotone" dataKey="totalSales" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Top Products</h2>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{p.productName}</p>
                  <p className="text-xs text-gray-400">{p.quantitySold} sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                {["Order #","Customer","Cashier","Items","Total","Status","Date"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customerName ?? "Walk-in"}</td>
                  <td className="px-4 py-3 text-gray-700">{order.cashierName}</td>
                  <td className="px-4 py-3 text-gray-500">{order.items.reduce((s,i)=>s+i.quantity,0)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "paid" ? "bg-green-100 text-green-700" :
                      order.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
