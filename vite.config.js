import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // Permite el host del túnel
    allowedHosts: [
      ".mynetname.net", // permite cualquier subdominio de mynetname.net
      // o puedes ser más específico:
      // "bb8e0bd2df17.sn.mynetname.net",
    ],
  },
});

