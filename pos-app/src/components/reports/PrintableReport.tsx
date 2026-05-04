import { useSettingsStore } from "@/stores/settingsStore";
import { formatCurrency } from "@/utils";
import type { DashboardSummary } from "@/types";
import dayjs from "dayjs";

interface Props {
  summary: DashboardSummary;
  range: string;
  ref?: React.Ref<HTMLDivElement>;
}

/** Printable report — rendered off-screen, activated by react-to-print */
export function PrintableReport({ summary, range, ref }: Props) {
  const { settings } = useSettingsStore();
  const rangeLabel = range === "today" ? "Today" : range === "week" ? "This Week" : "This Month";

  return (
    <div ref={ref} className="p-8 bg-white text-gray-900 font-sans max-w-3xl mx-auto print-avoid-break">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold">{settings.storeName}</h1>
        <p className="text-sm text-gray-500">{settings.address} · {settings.phone}</p>
        <h2 className="text-lg font-semibold mt-2">Sales Report — {rangeLabel}</h2>
        <p className="text-xs text-gray-400">Generated: {dayjs().format("DD MMM YYYY HH:mm")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 print-avoid-break">
        {[
          { label: "Total Revenue", value: formatCurrency(summary.todaySales) },
          { label: "Total Orders",  value: summary.todayOrders.toString()     },
          { label: "Avg. Order",    value: summary.todayOrders > 0 ? formatCurrency(summary.todaySales / summary.todayOrders) : "—" },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sales trend table */}
      <div className="mb-6 print-avoid-break">
        <h3 className="font-bold text-base mb-2 border-b border-gray-200 pb-1">Daily Sales Trend</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-3 font-semibold">Date</th>
              <th className="text-right py-2 px-3 font-semibold">Orders</th>
              <th className="text-right py-2 px-3 font-semibold">Revenue</th>
              <th className="text-right py-2 px-3 font-semibold">Avg. Value</th>
            </tr>
          </thead>
          <tbody>
            {summary.salesTrend.map((row, i) => (
              <tr key={row.date} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-2 px-3">{row.date}</td>
                <td className="py-2 px-3 text-right">{row.totalOrders}</td>
                <td className="py-2 px-3 text-right font-medium">{formatCurrency(row.totalSales)}</td>
                <td className="py-2 px-3 text-right text-gray-500">
                  {row.totalOrders > 0 ? formatCurrency(row.totalSales / row.totalOrders) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-bold">
              <td className="py-2 px-3">Total</td>
              <td className="py-2 px-3 text-right">{summary.todayOrders}</td>
              <td className="py-2 px-3 text-right">{formatCurrency(summary.todaySales)}</td>
              <td className="py-2 px-3 text-right text-gray-500">
                {summary.todayOrders > 0 ? formatCurrency(summary.todaySales / summary.todayOrders) : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Top products */}
      <div className="mb-6 print-avoid-break">
        <h3 className="font-bold text-base mb-2 border-b border-gray-200 pb-1">Top Products by Revenue</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-3 font-semibold">#</th>
              <th className="text-left py-2 px-3 font-semibold">Product</th>
              <th className="text-right py-2 px-3 font-semibold">Units Sold</th>
              <th className="text-right py-2 px-3 font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {summary.topProducts.slice(0, 10).map((p, i) => (
              <tr key={p.productId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                <td className="py-2 px-3 font-medium">{p.productName}</td>
                <td className="py-2 px-3 text-right">{p.quantitySold}</td>
                <td className="py-2 px-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
        {settings.receiptFooter} · Printed {dayjs().format("DD/MM/YYYY HH:mm")}
      </div>
    </div>
  );
}
