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
    server: {
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: ["localhost", "get-taste-app-pnnwq.ondigitalocean.app", ".ondigitalocean.app"],
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: { session: true },
});
