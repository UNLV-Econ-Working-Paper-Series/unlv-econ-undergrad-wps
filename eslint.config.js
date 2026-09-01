import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".astro/**",
      "artifacts/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "tmp/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      ...config.languageOptions,
      globals: { ...globals.node, ...globals.browser },
    },
  })),
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
];
