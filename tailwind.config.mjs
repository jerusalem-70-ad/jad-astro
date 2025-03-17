/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf7f3", // Lightest ivory/off-white
          100: "#f3ede3", // Light beige
          200: "#e6d5c3", // Beige
          300: "#e5894a", // Caramel accent
          400: "#c55a28", // Light orange-brown
          500: "#a92d03", // Orange-brown
          600: "#87260c", // Red-brown
          700: "#6f2009", // Medium brown
          800: "#581908", // Primary brown
          900: "#421305", // Darkest brown
          950: "#2c0d03", // Near black-brown
        },

        // Neutral tones for backgrounds and text
        neutral: {
          50: "#f9f6f1", // Background
          100: "#f1ece4",
          200: "#e8e0d4",
          300: "#d5c6b3",
          400: "#bba795",
          500: "#a08978",
          600: "#86705f",
          700: "#6b594b",
          800: "#4e3f35",
          900: "#332923",
          950: "#1f1813",
        },
        backgroundImage: {
          jerusalem: "url('title-image.png')",
        },
      },
    },
  },
  plugins: [typography],
};
