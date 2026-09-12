/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#06080d",
        panel: "#0e121a",
        ink: "#06080d",
        snow: "#e8edf2",
        fog: "#9aa3b2",
        mist: "#6b7382",
        trail: "#ff6b35",
        "trail-hot": "#ff824f",
        beacon: "#3dffa8",
        line: "#1c2330",
        // Legacy aliases used by other dashboard pages
        acid: "#ff6b35",
        violet: "#3dffa8",
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        trail: "0 0 40px rgba(255,107,53,0.16)",
        acid: "0 0 40px rgba(255,107,53,0.16)",
      },
    },
  },
  plugins: [],
};
