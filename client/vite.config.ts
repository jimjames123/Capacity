import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For the GitHub Pages project site the app is served under /Capacity/.
// Override with BASE_PATH if the repo is renamed or served elsewhere.
const base = process.env.BASE_PATH ?? "/";

// Proxies /api to the Express server during development.
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
