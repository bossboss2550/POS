import { useUIStore } from "@/stores/uiStore";

export function useNotification() {
  const addNotification = useUIStore(s => s.addNotification);
  return {
    success: (msg: string) => addNotification("success", msg),
    error:   (msg: string) => addNotification("error",   msg),
    warning: (msg: string) => addNotification("warning", msg),
    info:    (msg: string) => addNotification("info",    msg),
  };
}
