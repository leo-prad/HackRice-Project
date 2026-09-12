import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const tailwindConfig = path.join(root, "tailwind.config.js");

export default defineConfig(({ command }) => ({
  root,
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss({ config: tailwindConfig }), autoprefixer()],
    },
  },
  build: {
    outDir: path.resolve(root, "../public/email-assistant"),
    emptyOutDir: true,
    sourcemap: false,
  },
  /** Dev: open `http://localhost:5173/` — production build keeps `/email-assistant/` for Express. */
  base: command === "build" ? "/email-assistant/" : "/",
  server: {
    open: true,
  },
}));
