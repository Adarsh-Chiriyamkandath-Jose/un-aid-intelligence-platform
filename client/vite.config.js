// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Keep the config inside /client and use relative paths.
// Vercel Settings:
// - Root Directory: client
// - Output Directory: dist
export default defineConfig({
  plugins: [
    react(),
    // Optional: only enable Replit plugins in dev when running on Replit
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID
      ? []
      : []),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // No `root` here — because this file lives inside /client already.
  build: {
    outDir: "dist",        // ✅ output into client/dist
    assetsDir: "assets",   // optional, keeps assets under client/dist/assets
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
