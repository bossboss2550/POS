import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNotification } from "@/hooks/useNotification";
import { Input } from "@/components/ui/Input";
import { getServices } from "@/services";
import { Store, DollarSign, Receipt, Save } from "lucide-react";

const schema = z.object({
  storeName:     z.string().min(1, "Store name is required"),
  address:       z.string().optional(),
  phone:         z.string().optional(),
  taxRate:       z.coerce.number().min(0).max(100),
  currency:      z.string().min(1),
  currencySymbol:z.string().min(1),
  receiptFooter: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const CURRENCIES = [
  { code: "THB", symbol: "฿",  label: "Thai Baht"        },
  { code: "USD", symbol: "$",  label: "US Dollar"         },
  { code: "EUR", symbol: "€",  label: "Euro"              },
  { code: "GBP", symbol: "£",  label: "British Pound"     },
  { code: "JPY", symbol: "¥",  label: "Japanese Yen"      },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar"  },
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">{icon}</div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const notify = useNotification();

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      storeName:      settings.storeName,
      address:        settings.address,
      phone:          settings.phone,
      taxRate:        settings.taxRate * 100,
      currency:       settings.currency,
      currencySymbol: settings.currencySymbol,
      receiptFooter:  settings.receiptFooter,
    },
  });

  const watchedCurrency = watch("currency");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const newSettings = {
      storeName:      data.storeName,
      address:        data.address ?? "",
      phone:          data.phone ?? "",
      taxRate:        data.taxRate / 100,
      currency:       data.currency,
      currencySymbol: data.currencySymbol,
      receiptFooter:  data.receiptFooter ?? "",
    };
    // Save to Zustand (always works)
    updateSettings(newSettings);
    // Try to sync with API (non-blocking)
    try {
      const { settingsService } = await getServices();
      if (settingsService) await settingsService.updateSettings(newSettings);
    } catch {
      // API sync failed - settings still saved locally
    }
    notify.success("Settings saved successfully");
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your store preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SectionCard title="Store Information" icon={<Store className="w-4 h-4" />}>
          <div className="space-y-4">
            <Input label="Store Name *" {...register("storeName")}
              error={errors.storeName?.message} placeholder="My Store" />
            <Input label="Address" {...register("address")} placeholder="123 Main St, City" />
            <Input label="Phone" {...register("phone")} placeholder="+66 2-123-4567" />
          </div>
        </SectionCard>

        <SectionCard title="Tax & Currency" icon={<DollarSign className="w-4 h-4" />}>
          <div className="space-y-4">
            <Input label="Tax Rate (%)" type="number" min={0} max={100} step={0.1}
              {...register("taxRate")} error={errors.taxRate?.message} placeholder="7"
              suffix={<span className="text-gray-400 text-sm">%</span>} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select {...register("currency")}
                onChange={e => {
                  const cur = CURRENCIES.find(c => c.code === e.target.value);
                  setValue("currency", e.target.value);
                  if (cur) setValue("currencySymbol", cur.symbol);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Selected: {CURRENCIES.find(c => c.code === watchedCurrency)?.label}
              </p>
            </div>
            <Input label="Currency Symbol" {...register("currencySymbol")}
              error={errors.currencySymbol?.message} placeholder="฿" />
          </div>
        </SectionCard>

        <SectionCard title="Receipt" icon={<Receipt className="w-4 h-4" />}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
            <textarea {...register("receiptFooter")} rows={3}
              placeholder="Thank you for your purchase! Visit us again."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Printed at the bottom of every receipt</p>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between py-1">
          {isDirty && <p className="text-sm text-orange-500">You have unsaved changes</p>}
          <div className="ml-auto">
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 shadow-sm">
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
