import { defineConfig } from "astro/config";

import icon from "astro-icon";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
    open: "jad-astro",
  },

  integrations: [icon(), react()],
  site: "https://jerusalem-70-ad.github.io",
  base: "/jad-astro",

  build: {
    format: "directory",
    cleanUrls: true,
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["echarts"],
    },
  },
});