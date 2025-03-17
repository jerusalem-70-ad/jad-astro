import { defineConfig } from "astro/config";

import icon from "astro-icon";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
  },

  integrations: [icon()],
  site: "https://jerusalem-70-ad.github.io",
  base: "/jad-astro",

  build: {
    format: "directory",
    cleanUrls: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});