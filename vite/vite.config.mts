import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(import.meta.dirname, "src") }],
    dedupe: ["react", "react-dom"],
  },
  plugins: [react(), tailwindcss()],
  server: { port: 3000, strictPort: true },
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
        main: path.resolve(import.meta.dirname, "index.html"),
        tabs: path.resolve(import.meta.dirname, "tabs.html"),
      },
    },
  },
});
