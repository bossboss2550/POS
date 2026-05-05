import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreDrawer } from "./MobileMoreDrawer";
import { Notifications } from "@/components/shared/Notifications";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import { useUIStore } from "@/stores/uiStore";

const pageTitles: Record<string, string> = {
  "/":          "Dashboard",
  "/pos":       "Point of Sale",
  "/products":  "Products",
  "/orders":    "Orders",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/reports":   "Reports",
  "/settings":  "Settings",
};

export function MainLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "POS System";
  const { isMobile } = useMobileLayout();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const isPOSPage = location.pathname === "/pos";

  // Hamburger: on mobile → open the More drawer; on desktop → toggle sidebar collapse
  const handleMenuClick = () => {
    if (isMobile) setMoreOpen(true);
    else toggleSidebar();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — always rendered; controls its own visibility */}
      <Sidebar />

      {/* Main content shifts right when desktop sidebar is open */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          !isMobile && sidebarOpen ? "lg:pl-56" : ""
        }`}
      >
        {/* Header — hidden on mobile POS to maximise screen space */}
        {!(isMobile && isPOSPage) && (
          <Header title={title} onMenuClick={handleMenuClick} />
        )}

        <main
          className={`flex-1 overflow-auto ${
            isMobile
              ? isPOSPage
                ? "p-0"
                : "p-3 pb-24"
              : "p-2"
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <>
          <MobileBottomNav onMenuOpen={() => setMoreOpen(true)} />
          <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
        </>
      )}

      <Notifications />
    </div>
  );
}

