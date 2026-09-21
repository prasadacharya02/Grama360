import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi / preview proxies can open it
    port: 5173,
    strictPort: false,
    allowedHosts: true, // allow tunnelled / proxied hostnames (ngrok, e2b, etc.) for field testing
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
});
