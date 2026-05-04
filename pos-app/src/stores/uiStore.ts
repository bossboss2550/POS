import { create } from "zustand";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface UIStore {
  sidebarOpen: boolean;
  notifications: Notification[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (type: Notification["type"], message: string) => void;
  removeNotification: (id: string) => void;
}

// Start open on desktop (>= 1024px), closed on mobile
const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

export const useUIStore = create<UIStore>()((set, get) => ({
  sidebarOpen: isDesktop,
  notifications: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: open => set({ sidebarOpen: open }),
  addNotification: (type, message) => {
    const id = `notif-${Date.now()}`;
    set(s => ({ notifications: [...s.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 4000);
  },
  removeNotification: id =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));
