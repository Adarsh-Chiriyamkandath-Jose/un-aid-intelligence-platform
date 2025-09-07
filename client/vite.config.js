import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel Settings:
// - Root Directory: client
// - Output Directory: dist

export default defineConfig({
  root: ".", // Explicitly set client as root (not needed if running in client/)
  plugins: [
    react(),
    // Optional: only enable Replit-specific plugins if running on Replit
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID ? [] : []),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",        // outputs into client/dist
    assetsDir: "assets",   // assets under client/dist/assets
    emptyOutDir: true,     // clear dist on each build
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
