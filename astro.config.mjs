import { defineConfig } from "astro/config";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  output: "static",
  site: "https://unlv-econ-working-paper-series.github.io/unlv-econ-undergrad-wps/",
  base: "/unlv-econ-undergrad-wps",
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
