// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: {
    port: 8080,
    host: "0.0.0.0",
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["react-icons"],
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: { session: true },
});
