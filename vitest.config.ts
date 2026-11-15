import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const appDir = fileURLToPath(new URL("./app", import.meta.url));
const rootDir = fileURLToPath(new URL("./", import.meta.url));

/** Юнит-тесты чистой логики: рендер markdown, DTO, форматирование цен, ссылки, ЧПУ. */
export default defineConfig({
  resolve: {
    alias: {
      "~~": rootDir,
      "@@": rootDir,
      "~": appDir,
      "@": appDir,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default"],
  },
});
