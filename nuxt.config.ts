import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-11-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/tailwind.css", "~/assets/css/main.css"],
  vite: {
    // Tailwind CSS 4 подключается Vite-плагином, отдельный Nuxt-модуль не нужен (ADR-7).
    plugins: [tailwindcss()],
  },
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
    // Ключ HMAC для хеша токенов сессий админки (ADR-19). Пусто — sha256 без ключа.
    sessionSecret: process.env.SESSION_SECRET || "",
    // Папка загруженных изображений (ADR-21). Пусто — `.data/uploads` от корня проекта.
    uploadsDir: process.env.UPLOADS_DIR || "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  },
  app: {
    head: {
      // Класс `js` включает прогрессивные улучшения главной (макет `docs/sait-13`):
      // без него блоки `.reveal` видны сразу, а табы показывают все панели.
      htmlAttrs: { lang: "ru", class: "js" },
      link: [
        { rel: "icon", href: "/favicon.ico?v=6", sizes: "32x32 48x48" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png?v=6" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=6" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=6" },
      ],
      meta: [{ name: "format-detection", content: "telephone=no" }],
    },
  },
});
