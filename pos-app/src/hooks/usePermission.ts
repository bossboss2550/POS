import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

export function usePermission() {
  const { user, hasRole } = useAuthStore();
  return {
    isAdmin:   hasRole("admin"),
    isManager: hasRole("admin", "manager"),
    isCashier: hasRole("admin", "manager", "cashier"),
    can:       (...roles: UserRole[]) => hasRole(...roles),
    user,
  };
}
