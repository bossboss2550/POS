import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg"],
      manifest: {
        name: "POS System",
        short_name: "POS",
        description: "Modern Point of Sale — sell, manage stock, reports",
        theme_color: "#2563eb",
        background_color: "#f9fafb",
        display: "standalone",
        display_override: ["standalone", "window-controls-overlay"],
        orientation: "portrait-primary",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          { name: "New Sale", short_name: "Sell", description: "Open POS terminal", url: "/pos" },
          { name: "Inventory", short_name: "Stock", description: "Manage stock levels",  url: "/inventory" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
