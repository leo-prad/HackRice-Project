import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{js,ts,tsx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        // SF Pro / system — macOS-native.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'SF Pro Display'",
          "'Helvetica Neue'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Helvetica Neue'",
          "sans-serif",
        ],
        // Landing-page-only premium pairing (loaded in index.html).
        "landing-display": ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
        "landing-body": [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Mail workbench palette — remapped to match `land` (indigo on warm paper).
        mac: {
          sidebar: "#FAF9F6",
          "sidebar-hover": "#EEEDFC",
          "sidebar-pop": "#FFFFFF",
          list: "#FAF9F6",
          "list-active": "#EEEDFC",
          "list-hover": "#EEEDFC",
          "list-border": "#E8E6E0",
          reading: "#FFFFFF",
          "reading-alt": "#FAF9F6",
          "toolbar-border": "#E8E6E0",
          blue: "#4F46E5",
          "blue-hover": "#4338CA",
          badge: "#E8E6E0",
          "badge-dark": "#5C5C66",
          icon: "#5C5C66",
          "btn-border": "#E8E6E0",
          "text-dark": "#14141B",
          "text-dark-2": "#5C5C66",
          "text-light": "#14141B",
          "text-light-2": "#5C5C66",
          "side-label": "#5C5C66",
          "side-item": "#14141B",
          urgent: "#FF453A",
          "urgent-bg": "#FFEAE8",
          student: "#4F46E5",
          "student-bg": "#EEEDFC",
          admin: "#8E8E93",
          "admin-bg": "#EEEDFC",
          meeting: "#30A46C",
          "meeting-bg": "#E5F4EC",
        },
        // App tokens — aliases of `land` so existing incuria-* classes stay valid.
        incuria: {
          canvas: "#FAF9F6",
          sidebar: "#FAF9F6",
          surface: "#FFFFFF",
          ink: "#14141B",
          "ink-muted": "#5C5C66",
          border: "#E8E6E0",
          select: "#EEEDFC",
          "select-ring": "#C9C5F4",
          accent: "#4F46E5",
          "accent-soft": "#EEEDFC",
          "accent-hover": "#4338CA",
          "needs-reply": "#D1453B",
          "needs-reply-soft": "#FBEAE8",
          batch: "#4F46E5",
          "batch-soft": "#EEEDFC",
          "side-bg": "#17171E",
          "side-ink": "#F2F2F7",
          "side-ink-muted": "#9A9AA0",
          "side-hover": "rgba(255,255,255,0.06)",
          "side-active": "rgba(255,255,255,0.10)",
          "side-border": "rgba(255,255,255,0.08)",
        },
        // Landing-page identity — deep ink + refined indigo on warm paper.
        land: {
          canvas: "#FAF9F6",
          surface: "#FFFFFF",
          ink: "#14141B",
          "ink-muted": "#5C5C66",
          "ink-faint": "#9A9AA3",
          border: "#E8E6E0",
          accent: "#4F46E5",
          "accent-hover": "#4338CA",
          "accent-deep": "#3730A3",
          "accent-soft": "#EEEDFC",
        },
      },
      boxShadow: {
        "incuria-card": "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
        "incuria-card-hover": "0 2px 4px rgba(15,23,42,0.06), 0 16px 40px -16px rgba(15,23,42,0.16)",
        "incuria-pop": "0 12px 40px -8px rgba(15,23,42,0.18)",
        "land-card": "0 1px 2px rgba(20,20,27,0.04), 0 12px 32px -16px rgba(20,20,27,0.12)",
        "land-card-hover":
          "0 2px 4px rgba(20,20,27,0.05), 0 20px 48px -20px rgba(79,70,229,0.22)",
        "land-glow": "0 24px 64px -20px rgba(79,70,229,0.30)",
      },
    },
  },
  plugins: [],
};
