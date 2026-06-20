import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0090D0",
        "primary-dark": "#0077AD",
        accent: "#9AD8F0",
        charcoal: "#303030",
        steel: "#808080",
        "light-grey": "#D0D0D0",
        background: "#F7FAFC",
        "on-surface-variant": "#3f4850",
        error: "#ba1a1a",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-hanken)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
      },
      boxShadow: {
        subtle: "0px 2px 4px rgba(48, 48, 48, 0.05)",
      },
      backgroundImage: {
        // subtle technical grid overlay
        grid: "linear-gradient(#D0D0D0 1px, transparent 1px), linear-gradient(90deg, #D0D0D0 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
