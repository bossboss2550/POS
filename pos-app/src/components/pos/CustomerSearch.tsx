import { useState, useEffect, useDeferredValue } from "react";
import { getServices } from "@/services";
import { Input } from "@/components/ui/Input";
import { Search, UserCheck, X, Crown } from "lucide-react";
import type { Customer } from "@/types";

const tierColors = {
  bronze:   "text-amber-600",
  silver:   "text-gray-500",
  gold:     "text-yellow-500",
  platinum: "text-blue-500",
};

interface Props {
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
}

export function CustomerSearch({ selected, onSelect }: Props) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { customerService } = await getServices();
      const res = await customerService.getCustomers({ search: deferredSearch, pageSize: 20 });
      setCustomers(res.data);
    })();
  }, [open, deferredSearch]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 truncate">{selected.name}</p>
          <p className="text-xs text-blue-600">{selected.phone}</p>
        </div>
        <button onClick={() => onSelect(null)} className="text-blue-400 hover:text-blue-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Add customer (optional)</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30">
          <div className="p-2">
            <Input
              autoFocus placeholder="Search by name or phone..."
              prefix={<Search className="w-4 h-4" />}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {customers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No customers found</p>
            ) : (
              customers.map(c => (
                <button key={c.id} type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-gray-600">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Crown className={`w-3.5 h-3.5 ${tierColors[c.memberTier]}`} />
                    <span className="text-xs capitalize text-gray-500">{c.memberTier}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
