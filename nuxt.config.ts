export default defineNuxtConfig({
  compatibilityDate: "2026-11-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  nitro: {
    // Задачи Nitro (`server/tasks/`): досылка заявок в CRM, будущая чистка и импорт.
    experimental: { tasks: true },
  },
  runtimeConfig: {
    // Только сервер. В прод — NUXT_DATABASE_URL (или DATABASE_URL, см. server/utils/prisma.ts).
    databaseUrl: "",
    // Входящий вебхук Битрикс24; пустое значение — заявки копятся со статусом NEW.
    bitrix24WebhookUrl: process.env.BITRIX24_WEBHOOK_URL || "",
    // «true» по умолчанию: отправка в CRM не выполняется, пока явно не выключено.
    leadsDryRun: process.env.LEADS_DRY_RUN || "true",
    // Редакция политики обработки ПДн, которую фиксируем в Lead.consentVersion.
    leadsConsentVersion: process.env.LEADS_CONSENT_VERSION || "2026-11-15",
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
