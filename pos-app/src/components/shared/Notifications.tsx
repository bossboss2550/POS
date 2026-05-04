import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/utils";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
} as const;

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info:    "bg-blue-50 border-blue-200 text-blue-800",
} as const;

export function Notifications() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => {
        const Icon = icons[n.type];
        return (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border shadow-md pointer-events-auto",
              "animate-in slide-in-from-right-4 duration-300",
              colors[n.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
