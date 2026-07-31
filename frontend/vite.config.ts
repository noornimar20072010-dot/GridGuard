import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/chat": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/transformers": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/alerts": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})
