import type { IAuthService } from "../types";
import { apiGet, apiPost } from "@/lib/axios";
import type { User } from "@/types";

export const authService: IAuthService = {
  async login(email, password) {
    // NestJS returns { accessToken, refreshToken } — not { user, token }
    const { accessToken, refreshToken } = await apiPost<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, password });

    // Persist refresh token for silent renewal
    localStorage.setItem("refreshToken", refreshToken);

    // Temporarily store access token so axios interceptor sends it on /auth/me
    localStorage.setItem("pos_token", accessToken);

    // Fetch full user profile
    const user = await apiGet<User>("/auth/me");

    return { user, token: accessToken };
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken") ?? "";
      await apiPost("/auth/logout", { refreshToken });
    } catch {
      // ignore — clear local state regardless
    }
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("pos_token");
  },

  async me(_token) {
    return apiGet<User>("/auth/me");
  },
};
