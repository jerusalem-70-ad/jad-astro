/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brandBlack: "2e0e02",
        brandBrown: "#581908",
        brand: "#cd4835",
        brand50: "#fdf4f3",
        brand100: "#fce7e4",
        brand200: "#fad3ce",
        brand500: "#e16452",
        brand600: "#cd4835",
        brand900: "#772f25",
        brand950: "#40150f",
      },
      backgroundImage: {
        jerusalem: "url('title-image.png')",
      },
    },
  },
  plugins: [typography],
};
