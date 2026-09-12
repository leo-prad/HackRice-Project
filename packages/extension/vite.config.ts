import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "content/index": resolve(__dirname, "src/content/index.ts"),
        "background/service-worker": resolve(__dirname, "src/background/service-worker.ts"),
        "popup/popup": resolve(__dirname, "src/popup/popup.html"),
      },
      output: { entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" },
    },
  },
});
