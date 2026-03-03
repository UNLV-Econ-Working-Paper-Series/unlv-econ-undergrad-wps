import { defineConfig } from "astro/config";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  output: "static",
  site: "https://markjayson13.github.io",
  base: "/econ495journal_site",
  server: {
    host: true,
    port: 4321,
  },
  vite: {
    plugins: [basicSsl()],
    server: {
      https: true,
    },
  },
});
