/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brandBrown: "#581908",
        brandRed: "#a92d03",
        brandPaleWhite: "#faf7f3",
        brandRose: "#f3ede3",
        brandCaramel: "#e5894a",
      },
      backgroundImage: {
        jerusalem: "url('title-image.png')",
      },
    },
  },
  plugins: [typography],
};
