// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    ignores: ["generated/**", "docs/**"],
  },
  {
    name: "spectech/html",
    files: ["app/**/*.vue"],
    rules: {
      // HTML приходит из server/utils/markdown.ts: теги экранируются (ADR-14), v-html безопасен.
      "vue/no-v-html": "off",
    },
  },
);
