import { defineConfig } from "astro/config";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  output: "static",
  site: "https://econ-undergrad-wps.sites.unlv.edu",
  base: "/",
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
