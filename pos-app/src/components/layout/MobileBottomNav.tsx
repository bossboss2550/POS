import { NavLink } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { useCartStore } from "@/stores/cartStore";
import type { UserRole } from "@/types";
import {
  LayoutDashboard, ShoppingCart, Package,
  BarChart3, Menu
} from "lucide-react";
import { cn } from "@/utils";

interface Props {
  onMenuOpen: () => void;
}

const primaryNavItems = [
  { to: "/",         label: "Home",     icon: LayoutDashboard, roles: ["admin","manager","cashier"] },
  { to: "/pos",      label: "Sell",     icon: ShoppingCart,    roles: ["admin","manager","cashier"] },
  { to: "/products", label: "Products", icon: Package,         roles: ["admin","manager"] },
  { to: "/reports",  label: "Reports",  icon: BarChart3,       roles: ["admin","manager"] },
] as const;

export function MobileBottomNav({ onMenuOpen }: Props) {
  const { can } = usePermission();
  const cartCount = useCartStore(s => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const allowedItems = primaryNavItems.filter(i => can(...(i.roles as unknown as UserRole[])));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {allowedItems.map(item => {
        const Icon = item.icon;
        const isPOS = item.to === "/pos";
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative min-h-[56px]",
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            )}
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={cn("w-5 h-5", isActive && "scale-110 transition-transform")} />
                  {isPOS && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-b-full" />
                )}
              </>
            )}
          </NavLink>
        );
      })}

      {/* More menu button */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-gray-500 hover:text-gray-700 min-h-[56px]"
        aria-label="More options"
      >
        <Menu className="w-5 h-5" />
        <span>More</span>
      </button>
    </nav>
  );
}
