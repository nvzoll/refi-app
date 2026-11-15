import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(configDir, "src") }],
    dedupe: ["react", "react-dom"],
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    entries: ["index.html", "tabs.html"],
    include: ["firestore-serializers"],
  },
  build: {
    minify: false,
    reportCompressedSize: false,
    target: "chrome89",
    rolldownOptions: {
      input: {
        main: path.resolve(configDir, "index.html"),
        tabs: path.resolve(configDir, "tabs.html"),
      },
    },
  },
});
