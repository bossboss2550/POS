import { useEffect, useState } from "react";
import { Clock3, ReceiptText, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/utils";

export function CustomerDisplayPage() {
  const [now, setNow] = useState(() => new Date());
  const { settings } = useSettingsStore();
  const items = useCartStore((state) => state.items);
  const customer = useCartStore((state) => state.customer);
  const subtotal = useCartStore((state) => state.subtotal());
  const discountAmount = useCartStore((state) => state.discountAmount());
  const taxAmount = useCartStore((state) => state.taxAmount());
  const total = useCartStore((state) => state.total());
  const itemCount = useCartStore((state) => state.itemCount());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const currentTime = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <title>Customer Display</title>

      <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 px-5 py-5 shadow-2xl shadow-cyan-950/40">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Customer Display</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">{settings.storeName}</h1>
              <p className="mt-2 text-base text-slate-300 sm:text-lg">
                Review your items and total before payment.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Items</p>
                <p className="mt-2 text-3xl font-black text-white sm:text-4xl">{itemCount}</p>
              </section>
              <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Customer</p>
                <p className="mt-2 truncate text-xl font-bold text-white sm:text-2xl">{customer?.name ?? "Walk-in"}</p>
              </section>
              <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-cyan-200">
                  <Clock3 className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.25em]">Time</span>
                </div>
                <p className="mt-2 text-3xl font-black text-cyan-100 sm:text-4xl">{currentTime}</p>
              </section>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.9fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Current Cart</h2>
                <p className="text-sm text-slate-400 sm:text-base">Updates in real time from the cashier screen.</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <EmptyState
                  icon={<ReceiptText className="h-16 w-16" />}
                  title="No items in cart"
                  description="Scanned products will appear here, and the screen clears after checkout or held bill."
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="grid grid-cols-[minmax(0,1fr)_140px_120px] gap-3 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Product</span>
                  <span className="text-center">Qty x Price</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-white/10">
                  {items.map((item) => (
                    <article
                      key={item.product.id}
                      className="grid grid-cols-[minmax(0,1fr)_140px_120px] gap-3 px-4 py-4 text-white"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-bold sm:text-2xl">{item.product.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{item.product.barcode || "No barcode"}</p>
                      </div>
                      <div className="flex items-center justify-center text-lg font-semibold sm:text-xl">
                        {item.quantity} x {formatCurrency(item.unitPrice, settings.currencySymbol)}
                      </div>
                      <div className="flex items-center justify-end text-2xl font-black text-cyan-300">
                        {formatCurrency(item.total, settings.currencySymbol)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/10 to-slate-900 p-5 shadow-2xl shadow-cyan-950/40">
            <h2 className="text-xl font-black uppercase tracking-[0.25em] text-cyan-300">Payment Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                <span className="text-lg text-slate-300">Subtotal</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(subtotal, settings.currencySymbol)}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                <span className="text-lg text-slate-300">Discount</span>
                <span className="text-2xl font-bold text-amber-300">-{formatCurrency(discountAmount, settings.currencySymbol)}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                <span className="text-lg text-slate-300">Tax</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(taxAmount, settings.currencySymbol)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Total to Pay</p>
              <p className="mt-3 text-5xl font-black tracking-tight text-cyan-100 sm:text-6xl">
                {formatCurrency(total, settings.currencySymbol)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
