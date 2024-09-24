/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brandBrown: "#581908",
        brandRed: "#a92d03",
        brandPaleWhite: "#fdf4f3",
        brandRose: "#fce7e4",
        brandCaramel: "#d27e45",
      },
      backgroundImage: {
        jerusalem: "url('title-image.png')",
      },
    },
  },
  plugins: [typography],
};
