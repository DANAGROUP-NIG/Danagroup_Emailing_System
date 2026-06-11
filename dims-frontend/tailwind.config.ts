import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "ui-sans-serif", "system-ui", "sans-serif"],
        rubik: ["Rubik", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // ─── Dana Brand ──────────────────────────────────────────────────────
        "dana-blue": {
          DEFAULT: "#2e348f",
          50: "#eef0fc",
          100: "#d9dcf8",
          200: "#b8bef1",
          300: "#8b93e7",
          400: "#5d66db",
          500: "#2e348f",
          600: "#252a7a",
          700: "#1c2065",
          800: "#131650",
          900: "#0a0c3b",
          950: "#05061f",
        },
        "dana-red": {
          DEFAULT: "#e9212e",
          50: "#fff1f2",
          100: "#ffe0e2",
          200: "#ffc5c9",
          300: "#ff9ba0",
          400: "#ff5f67",
          500: "#e9212e",
          600: "#d01520",
          700: "#af1019",
          800: "#911018",
          900: "#781119",
          950: "#420409",
        },
        // ─── Semantic Aliases ────────────────────────────────────────────────
        primary: {
          DEFAULT: "#2e348f",
          foreground: "#ffffff",
          hover: "#252a7a",
          light: "#eef0fc",
        },
        danger: {
          DEFAULT: "#e9212e",
          foreground: "#ffffff",
          hover: "#d01520",
          light: "#fff1f2",
        },
        success: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
          light: "#f0fdf4",
        },
        warning: {
          DEFAULT: "#d97706",
          foreground: "#ffffff",
          light: "#fffbeb",
        },
        // ─── Neutral / UI ────────────────────────────────────────────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "dana-sm": "0 1px 2px 0 rgba(46, 52, 143, 0.08)",
        dana: "0 2px 8px 0 rgba(46, 52, 143, 0.12)",
        "dana-md": "0 4px 16px 0 rgba(46, 52, 143, 0.16)",
        "dana-lg": "0 8px 32px 0 rgba(46, 52, 143, 0.20)",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    require('tailwindcss-animate'),
  ],
};

export default config;
