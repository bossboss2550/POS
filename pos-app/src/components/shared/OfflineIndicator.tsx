import { useOfflineStore } from "@/stores/offlineStore";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, isSyncing, queue } = useOfflineStore();

  if (isOnline && queue.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      isOnline ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-orange-50 text-orange-700 border border-orange-200"
    }`}>
      {isOnline ? (
        isSyncing ? (
          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing {queue.length} order{queue.length > 1 ? "s" : ""}...</>
        ) : (
          <><Wifi className="w-3.5 h-3.5" /> {queue.length} order{queue.length > 1 ? "s" : ""} queued</>
        )
      ) : (
        <><WifiOff className="w-3.5 h-3.5" /> Offline — {queue.length > 0 ? `${queue.length} queued` : "orders will be queued"}</>
      )}
    </div>
  );
}
