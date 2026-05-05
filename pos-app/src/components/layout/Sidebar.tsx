import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";
import { useUIStore } from "@/stores/uiStore";
import { usePermission } from "@/hooks/usePermission";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Users, BarChart3, Settings, X, Store, Printer
} from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { to: "/",          key: "dashboard",  icon: LayoutDashboard, roles: ["admin","manager","cashier"] },
  { to: "/pos",       key: "pos",        icon: ShoppingCart,    roles: ["admin","manager","cashier"] },
  { to: "/products",  key: "products",   icon: Package,         roles: ["admin","manager"] },
  { to: "/price-tags", key: "priceTags", icon: Printer,         roles: ["admin","manager"] },
  { to: "/orders",    key: "orders",     icon: ClipboardList,   roles: ["admin","manager","cashier"] },
  { to: "/customers", key: "customers",  icon: Users,           roles: ["admin","manager"] },
  { to: "/inventory", key: "inventory",  icon: BarChart3,       roles: ["admin","manager"] },
  { to: "/reports",   key: "reports",    icon: BarChart3,       roles: ["admin","manager"] },
  { to: "/settings",  key: "settings",   icon: Settings,        roles: ["admin"] },
] as const;

export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { can } = usePermission();
  const { isMobile } = useMobileLayout();
  const location = useLocation();

  // Auto-close sidebar overlay when navigating on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  return (
    <>
      {/* Overlay backdrop — shown on mobile when sidebar is open */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-56 bg-gray-900 text-white z-30 flex flex-col",
          "transition-transform duration-300",
          // On mobile: slide in/out based on sidebarOpen
          // On desktop: translate-x-0 when open, -translate-x-full when closed
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg tracking-tight">POS System</span>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map(item => {
            if (!can(...(item.roles as any))) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {t(`nav.${item.key}`)}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

