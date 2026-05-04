import { Menu, Bell, LogOut, User } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { getServices } from "@/services";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void; // optional override; defaults to toggleSidebar
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { toggleSidebar, notifications } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { authService } = await getServices();
    await authService.logout();
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick ?? toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-gray-800 text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <OfflineIndicator />
        <LanguageSwitcher />

        {/* Notification bell */}
        <button className="relative p-2 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
