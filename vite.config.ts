import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { guideMiddleware } from "./server/guide";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "guide-groq",
      configureServer(server) {
        server.middlewares.use(guideMiddleware(mode));
      },
      configurePreviewServer(server) {
        server.middlewares.use(guideMiddleware(mode));
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        bypass(req) {
          const requestPath = req.url?.split("?")[0] ?? "";
          if (requestPath === "/api/guide") return requestPath;
        },
      },
    },
  },
}));
