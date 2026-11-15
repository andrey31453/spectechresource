import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const appDir = fileURLToPath(new URL("./app", import.meta.url));
const rootDir = fileURLToPath(new URL("./", import.meta.url));

/** Юнит-тесты чистой логики: схемы заявки, markdown, DTO, цены, телефоны, ЧПУ. */
export default defineConfig({
  resolve: {
    alias: {
      "#shared": fileURLToPath(new URL("./shared", import.meta.url)),
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
