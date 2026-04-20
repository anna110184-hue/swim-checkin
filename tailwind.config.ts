import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fdf8e7",
          100: "#f9edba",
          200: "#f3d96e",
          300: "#ecc12b",
          400: "#d4a017",
          500: "#B8860B",
          600: "#9a6f09",
          700: "#7a5807",
          800: "#5a4005",
          900: "#3a2903",
        },
        cream: "#FAF7F0",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
