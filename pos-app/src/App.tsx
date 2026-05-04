import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ApiErrorBoundary } from "@/components/shared/ApiErrorBoundary";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { POSPage } from "@/pages/POSPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { PriceTagsPage } from "@/pages/PriceTagsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { CustomerDisplayPage } from "@/pages/CustomerDisplayPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/customer-display"
            element={
              <AuthGuard roles={["admin", "manager", "cashier"]}>
                <ApiErrorBoundary>
                  <CustomerDisplayPage />
                </ApiErrorBoundary>
              </AuthGuard>
            }
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<ApiErrorBoundary><DashboardPage /></ApiErrorBoundary>} />
            <Route path="pos" element={<ApiErrorBoundary><POSPage /></ApiErrorBoundary>} />
            <Route path="products" element={<AuthGuard roles={["admin", "manager"]}><ApiErrorBoundary><ProductsPage /></ApiErrorBoundary></AuthGuard>} />
            <Route path="price-tags" element={<AuthGuard roles={["admin", "manager"]}><ApiErrorBoundary><PriceTagsPage /></ApiErrorBoundary></AuthGuard>} />
            <Route path="orders" element={<ApiErrorBoundary><OrdersPage /></ApiErrorBoundary>} />
            <Route path="customers" element={<AuthGuard roles={["admin", "manager"]}><ApiErrorBoundary><CustomersPage /></ApiErrorBoundary></AuthGuard>} />
            <Route path="inventory" element={<AuthGuard roles={["admin", "manager"]}><ApiErrorBoundary><InventoryPage /></ApiErrorBoundary></AuthGuard>} />
            <Route path="reports" element={<AuthGuard roles={["admin", "manager"]}><ApiErrorBoundary><ReportsPage /></ApiErrorBoundary></AuthGuard>} />
            <Route path="settings" element={<AuthGuard roles={["admin"]}><ApiErrorBoundary><SettingsPage /></ApiErrorBoundary></AuthGuard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}

export default App;
