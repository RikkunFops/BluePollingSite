import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@shared": path.resolve(__dirname, "../shared")
    }
  },

  server: {
    host: true,
    port: 3000,
    allowedHosts: ["blueboye.com", "www.blueboye.com"],
    proxy: {
      "/api": {
        target: "http://backend:5000",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://backend:5000"
      }
    }
  }
});
