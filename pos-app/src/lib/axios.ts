import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";

// ─── Environment base URLs ────────────────────────────────────────────────────
// Set VITE_API_BASE_URL in .env.production / .env.staging
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ─── Create instance ──────────────────────────────────────────────────────────
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Prefer Zustand store token; fall back to localStorage for the /auth/me
    // call that happens inside login() before setAuth() populates the store.
    const token = useAuthStore.getState().token ?? localStorage.getItem("pos_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — token refresh + global error handling ─────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  pendingQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── 401 Unauthorized: attempt silent token refresh ──────────────────────
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue all calls while refresh is in progress
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post<{ token: string; refreshToken: string }>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        // Persist new tokens
        useAuthStore.getState().setToken(data.token);
        localStorage.setItem("refreshToken", data.refreshToken);

        processQueue(null, data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Force logout on refresh failure
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────
    if (error.response?.status === 403) {
      console.warn("[API] 403 Forbidden:", original.url);
    }

    // ── 5xx: add retry metadata for TanStack Query ─────────────────────────
    if (error.response && error.response.status >= 500) {
      (error as AxiosError & { isServerError: boolean }).isServerError = true;
    }

    return Promise.reject(error);
  },
);

// ─── Typed helper — unwrap ApiResponse<T> envelope ───────────────────────────
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await axiosInstance.get<{ data: T; success: boolean }>(url, { params });
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await axiosInstance.post<{ data: T; success: boolean }>(url, body);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await axiosInstance.patch<{ data: T; success: boolean }>(url, body);
  return data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await axiosInstance.delete(url);
}
