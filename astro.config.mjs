import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://econ-undergrad-wps.sites.unlv.edu",
  base: "/",
  compressHTML: true,
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: true,
  },
  build: {
    inlineStylesheets: "never",
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4321,
  },
});
