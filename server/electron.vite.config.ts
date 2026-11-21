import path from "node:path";
import { defineConfig, mergeConfig } from "electron-vite";
import rendererConfig from "../vite/vite.config.mts";

export default defineConfig(({ command }) => {
  const sourcemap = command === "serve" ? "inline" : false;

  return {
    main: {
      build: {
        sourcemap,
        externalizeDeps: {
          include: ["electron-devtools-installer", "source-map-support"],
        },
        rolldownOptions: {
          input: {
            index: path.resolve(__dirname, "src/index.ts"),
            "workers/server": path.resolve(__dirname, "src/workers/server.ts"),
          },
        },
      },
    },
    preload: {
      build: {
        sourcemap,
        rolldownOptions: {
          input: {
            "client-preload": path.resolve(__dirname, "src/client-preload.js"),
            "tab-preload": path.resolve(__dirname, "src/tab-preload.js"),
          },
        },
      },
    },
    renderer: mergeConfig(rendererConfig, {
      root: path.resolve(__dirname, "../vite"),
      build: {
        outDir: path.resolve(__dirname, "out/renderer"),
      },
    }),
  };
});
