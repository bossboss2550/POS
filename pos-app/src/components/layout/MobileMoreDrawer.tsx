import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, Package, Printer, Users, BarChart3, Settings, LogOut, X, User } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/authStore";
import { getServices } from "@/services";
import type { UserRole } from "@/types";
import { cn } from "@/utils";

const moreItems = [
  { to: "/orders",    label: "Orders",    icon: ClipboardList, roles: ["admin","manager","cashier"] },
  { to: "/products",  label: "Products",  icon: Package,       roles: ["admin","manager"] }, // Added Products
  { to: "/price-tags",label: "Price Tags",icon: Printer,       roles: ["admin","manager"] }, // Added Price Tags
  { to: "/customers", label: "Customers", icon: Users,          roles: ["admin","manager"] },
  { to: "/inventory", label: "Inventory", icon: BarChart3,      roles: ["admin","manager"] },
  { to: "/reports",   label: "Reports",   icon: BarChart3,     roles: ["admin","manager"] }, // Added Reports
  { to: "/settings",  label: "Settings",  icon: Settings,       roles: ["admin"] },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileMoreDrawer({ open, onClose }: Props) {
  const { can } = usePermission();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const items = moreItems.filter(i => can(...(i.roles as unknown as UserRole[])));

  const handleLogout = async () => {
    const { authService } = await getServices();
    await authService.logout();
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl",
          "transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div className="py-2">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-5 py-3.5 text-sm font-medium transition-colors",
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 py-2 mb-1">
          <button onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3.5 w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
