export default defineNuxtConfig({
  compatibilityDate: "2026-11-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    // Только сервер. В прод — NUXT_DATABASE_URL (или DATABASE_URL, см. server/utils/prisma.ts).
    databaseUrl: "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      meta: [{ name: "format-detection", content: "telephone=no" }],
    },
  },
});
