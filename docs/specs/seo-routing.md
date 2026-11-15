# Спека: SEO-каркас и ЧПУ-роутинг (`seo-routing`), v1

| | |
|---|---|
| Статус | ✅ реализовано 15.11.2026 |
| Слайс | публичные страницы каталога + мета, canonical, JSON-LD, sitemap, robots, 301, 404 |
| Не входит | формы и `Lead`, Метрика и цели, админка, загрузка фото, дизайн-система (стили — технические) |

## Маршруты (STR-01…STR-06, STR-08)

| URL | Файл | Данные |
|---|---|---|
| `/` | `app/pages/index.vue` | `/api/home`: разделы, услуги, преимущества, шаги, цифры, общий FAQ |
| `/katalog` | `app/pages/katalog/index.vue` | `/api/catalog` |
| `/katalog/{categorySlug}` | `app/pages/katalog/[category].vue` | `/api/catalog/{slug}` |
| `/arenda-{typeSlug}-v-{citySlug}` | `app/pages/arenda-[slug].vue` | `/api/landing?typeSlug&citySlug` |
| `/uslugi` · `/uslugi/{slug}` | `app/pages/uslugi/*` | `/api/services`, `/api/services/{slug}` |
| `/kontakty` | `app/pages/kontakty.vue` | `/api/site` |
| `/{pageSlug}` (политика ПДн) | `app/pages/[slug].vue` | `/api/pages/{slug}` |
| любой неизвестный | `app/error.vue` | 404 с навигацией |

## API (только чтение, публичные)

| Эндпоинт | Возвращает |
|---|---|
| `GET /api/site` | `SiteSettings` + `city` (телефон, мессенджеры, реквизиты, дисклеймер) |
| `GET /api/home` | разделы с видами, услуги, преимущества, шаги, цифры, FAQ `scope=GLOBAL` |
| `GET /api/catalog` | 8 опубликованных разделов + опубликованные виды |
| `GET /api/catalog/{slug}` | раздел + его виды; 404 если нет/не опубликован |
| `GET /api/landing?typeSlug=&citySlug=` | вид + раздел + город + модели с характеристиками + FAQ вида + «похожая техника» |
| `GET /api/services` · `/api/services/{slug}` | 5 услуг / услуга + FAQ `scope=SERVICE` |
| `GET /api/pages/{slug}` | страница: `title`, `contentHtml` (мини-рендер markdown) |

Правила: только `isPublished = true`; неизвестный slug → `404` с JSON `{ statusCode, statusMessage }`;
`Decimal` отдаётся строкой (`"26000.00"`), `null` = «цена по запросу».

## SEO-правила

- **canonical** — всегда абсолютный, из `NUXT_PUBLIC_SITE_URL` + путь без слеша.
- **title/description**: ручные `seoTitle`/`seoDescription` → иначе шаблон
  (`Аренда {nameGenitive} в {city.nameIn} — цена от N ₽ за смену | ООО «СПЕЦТЕХРЕСУРС»`).
- **H1** — ровно один: `Category.h1` → `Аренда {title.toLowerCase()} в {city.nameIn}`;
  `Аренда {nameGenitive} в {city.nameIn}`.
- **JSON-LD**: `Organization` + `WebSite` (в layout), `BreadcrumbList` (страницы глубже главной),
  `Product`+`Offer` (посадочная, если есть цена), `FAQPage` (если есть вопросы).
- **skлейка URL**: `/path/` → `301` на `/path`; запись из таблицы `Redirect` → `301` на `to`
  (кэш в памяти 60 с). Неверный город в посадочной → `301` на город по умолчанию из `City`.
- `sitemap.xml` и `robots.txt` — **Nitro-роуты** (`server/routes/`), не модули: нужен точный контроль,
  лишние зависимости не тянем (ADR-13). `robots.txt`: `Disallow: /admin`, `/api`.

## Ошибки

- 404 — при неизвестном/неопубликованном slug, неверном формате `arenda-…`, неизвестной странице.
- 500 — при недоступной БД; `error.vue` показывает код и ссылки на главную/каталог.

## Готово, когда (проверяется curl)

1. `GET /` → 200, один `<h1>`, title и canonical содержат город из `City`.
2. `GET /arenda-gusenichnogo-ekskavatora-v-moskve` → 200, H1 «Аренда гусеничного экскаватора в Москве»,
   в HTML есть `Product` и `FAQPage`.
3. тот же URL `-v-kazan` → `301` на `-v-moskva`; `/katalog/` → `301` на `/katalog`.
4. `/arenda-net-takogo-vida-v-moskve` и `/nesushchestvuyushchaya-stranica` → `404`.
5. `/sitemap.xml` содержит 8 разделов, 39 видов, 5 услуг, страницу политики; `/robots.txt` закрывает `/admin`.
6. `npm run build` проходит, SSR-страницы не требуют клиентского JS для контента.

## Результаты проверки (15.11.2026, `nuxt build` + `node .output/server/index.mjs`, порт 3999)

- `/`, `/katalog`, `/katalog/zemleroynaya-tehnika`, `/arenda-gusenichnogo-ekskavatora-v-moskva`,
  `/uslugi`, `/uslugi/zemlyanye-raboty`, `/kontakty`, `/politika-obrabotki-personalnyh-dannyh` — **200**, ровно один `<h1>`.
- Посадочная: title «Аренда гусеничного экскаватора в Москве — от 26 000 ₽ за смену | ООО «СПЕЦТЕХРЕСУРС»»,
  canonical абсолютный; JSON-LD — `Organization`, `BreadcrumbList`, `Product`, `Offer`,
  `UnitPriceSpecification`, `FAQPage`. Таблица моделей: Hitachi ZX200-5G / JCB JS205.
- `/katalog/` → **301** `/katalog`; `/arenda-…-v-moskve` → **301** `/arenda-…-v-moskva`;
  запись из `Redirect` (`/arenda-staraya-stranica`) → **301** `/katalog` (кэш в памяти 60 с).
- `/arenda-net-takogo-vida-v-moskve`, `/nesushchestvuyushchaya-stranica`, `/katalog/net-takogo` → **404**.
- `/sitemap.xml` — **57** URL (4 статических + 8 разделов + 39 видов + 5 услуг + 1 страница); `/robots.txt` закрывает
  `/admin` и `/api`, указывает `Sitemap`.
- API (`/api/site`, `/api/catalog`, `/api/home`, `/api/services`, `/api/landing`) — **200**, `Decimal` строкой.
- В сид добавлены демо-H1 и короткие описания 8 разделов: заполняются только если поле пустое,
  правки из админки не затираются.

## Отклонения от v1 (зафиксированы в ADR)

- `sitemap.xml`/`robots.txt` — Nitro-роуты, без `@nuxtjs/seo` (ADR-13).
- Markdown (`seoText`, `worksPerformed`, политика) рендерится на сервере мини-рендерером с экранированием
  и отдаётся полями `seoTextHtml` / `worksPerformedHtml` (ADR-14).
- Vitest/ESLint в слайсе не подключены — перенесены на старт слайса форм (зафиксировано в `AGENTS.md` §5).
