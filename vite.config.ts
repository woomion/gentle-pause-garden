import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "Pocket Pause",
        short_name: "Pocket Pause",
        description: "Pause before you purchase. Make mindful buying decisions.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#f97316",
        orientation: "portrait-primary",
        scope: "/",
        icons: [
          {
            src: "/icons/app-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        share_target: {
          action: "/",
          method: "GET",
          params: {
            url: "url",
            text: "text",
            title: "title"
          }
        },
        categories: ["shopping", "lifestyle", "productivity"],
        lang: "en-US"
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
