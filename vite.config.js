import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // En local, el front (5173) le pasa las llamadas /api al backend (8000)
    proxy: { "/api": "http://localhost:8000" },
  },
});
