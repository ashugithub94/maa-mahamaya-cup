import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#060a12",
        night: "#0b101b",
        panel: "#111925",
        gold: "#f4c84b",
        goldBright: "#ffe28a",
        signal: "#f05745",
        ice: "#e9eef7",
        muted: "#8d98aa"
      },
      boxShadow: {
        glow: "0 0 45px rgba(244, 200, 75, .2)",
        "glow-red": "0 0 35px rgba(240, 87, 69, .17)"
      },
      fontFamily: {
        display: ["Impact", "Arial Narrow", "Arial", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "gold-sheen": "linear-gradient(110deg, #dca930, #ffe28a 42%, #d9a52f)",
        "red-sheen": "linear-gradient(110deg, #b7352d, #f05745)"
      }
    }
  },
  plugins: []
};

export default config;
