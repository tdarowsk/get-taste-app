import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import { env as processEnv } from "process";

const port = processEnv.PORT ? parseInt(processEnv.PORT) : 8080;
const host = processEnv.HOST || "0.0.0.0";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    session: true,
  },
  server: {
    host,
    port,
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["react-icons"],
    },
    server: {
      host,
      port,
    },
  },
});
