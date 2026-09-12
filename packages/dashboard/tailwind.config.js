/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#07090e", panel: "#0d1119", line: "#202632", acid: "#b9f456", violet: "#a78bfa" },
    fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] },
    boxShadow: { acid: "0 0 40px rgba(185,244,86,.14)" },
  } }, plugins: [],
};
