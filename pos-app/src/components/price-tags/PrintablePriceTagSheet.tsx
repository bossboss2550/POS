import dayjs from "dayjs";
import { BarcodeSvg } from "@/components/price-tags/BarcodeSvg";
import { formatCurrency } from "@/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Product } from "@/types";

export interface PriceTagPrintItem {
  product: Product;
  copyNumber: number;
  totalCopies: number;
}

interface PrintablePriceTagSheetProps {
  items: PriceTagPrintItem[];
  ref?: React.Ref<HTMLDivElement>;
}

export function PrintablePriceTagSheet({ items, ref }: PrintablePriceTagSheetProps) {
  const { settings } = useSettingsStore();

  return (
    <div ref={ref} className="mx-auto max-w-6xl bg-white p-3 text-gray-900 print-sheet">
      <div className="mb-3 border-b border-gray-200 pb-2 print-avoid-break">
        <h1 className="text-base font-bold">Price Tag Sheet</h1>
        <p className="text-[11px] text-gray-500">Printed {dayjs().format("DD/MM/YYYY HH:mm")}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 print-tag-grid">
        {items.map((item) => (
          <article key={`${item.product.id}-${item.copyNumber}`} className="rounded border border-gray-300 bg-white px-1.5 py-1 shadow-sm print-tag-card">
            <h2 className="line-clamp-1 text-center text-[10px] font-semibold leading-tight text-gray-900">
              {item.product.name}
            </h2>

            <div className="mt-0.5 text-center">
              <p className="text-lg font-black tracking-tight text-blue-700">
                {formatCurrency(item.product.price, settings.currencySymbol)}
              </p>
            </div>

            <div className="mt-0.5 pt-0.5 text-center">
              <BarcodeSvg value={item.product.barcode} className="mx-auto w-full max-w-[140px]" />
              <p className="mt-0 font-mono text-[9px] tracking-tight text-gray-600">{item.product.barcode}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
