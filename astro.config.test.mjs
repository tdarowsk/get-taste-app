import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [react()],
  // Test-specific configuration
  server: {
    port: 3000,
  },
  experimental: {
    session: true,
  },
  vite: {
    define: {
      "process.env.DISABLE_AUTH": JSON.stringify("true"),
      "process.env.NODE_ENV": JSON.stringify("test"),
    },
  },
});
