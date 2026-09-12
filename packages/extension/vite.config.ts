import { defineConfig } from "vite";
import { resolve } from "node:path";

// Chrome MV3 content scripts cannot be ES modules, so the content bundle
// must be a self-contained IIFE. Background (declared type: "module") and the
// popup HTML can stay as ES modules.
const isContentBuild = process.env.QL_BUILD_TARGET === "content";

export default defineConfig(
  isContentBuild
    ? {
        root: "src",
        publicDir: false,
        build: {
          outDir: "../dist",
          emptyOutDir: false,
          rollupOptions: {
            input: { "content/index": resolve(__dirname, "src/content/index.ts") },
            output: {
              format: "iife",
              entryFileNames: "[name].js",
              inlineDynamicImports: true,
            },
          },
        },
      }
    : {
        root: "src",
        publicDir: "../public",
        build: {
          outDir: "../dist",
          emptyOutDir: true,
          rollupOptions: {
            input: {
              "background/service-worker": resolve(__dirname, "src/background/service-worker.ts"),
              "popup/popup": resolve(__dirname, "src/popup/popup.html"),
            },
            output: {
              entryFileNames: "[name].js",
              chunkFileNames: "chunks/[name]-[hash].js",
              assetFileNames: "assets/[name]-[hash][extname]",
            },
          },
        },
      },
);
