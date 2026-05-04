import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, symbol = "฿"): string {
  return `${symbol}${roundCurrency(amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string, fmt = "DD/MM/YYYY HH:mm"): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hour = d.getHours().toString().padStart(2, "0");
  const minute = d.getMinutes().toString().padStart(2, "0");

  return fmt
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", year.toString())
    .replace("HH", hour)
    .replace("mm", minute);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${date}-${rand}`;
}

export function calculateChange(tendered: number, total: number): number {
  return Math.max(0, tendered - total);
}

function getAssetOrigin() {
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    return new URL(API_BASE_URL).origin;
  }

  return window.location.origin;
}

export function resolveProductImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return new URL(imageUrl, `${getAssetOrigin()}/`).toString();
}

