# Спека: фронтенд сайта (этап 5)

> Кэш контекста для нового чата. Читать вместе с `AGENTS.md`, `TODO.md` §5 и `docs/stack.md` (ADR-7).
> Спека описывает **как есть**: если код разошёлся со спекой — правится спека, потом код.

## 1. Цель и режим работы

Превратить существующий SEO-каркас в публичный сайт: дизайн, адаптив, формы, изображения, аналитика.
Контент — демо из сида, пока заказчик не ответил по Q-08 (фото, модели, цены, тексты).

**Полуручной режим.** Дизайн-решения и визуальная приёмка — за человеком; реализация — по одному экрану
за итерацию. Порядок итерации: план (файлы, риски) → правки → `lint`/`typecheck`/`build` → смоук на живом
сервере → отчёт с тем, что не проверено. Не расширять скоуп молча.

## 2. Что уже есть (не переписывать без причины)

| Экран | Файл | Данные |
|---|---|---|
| Оболочка сайта | `app/layouts/default.vue` | `useSite()`, Organization JSON-LD |
| Главная | `app/pages/index.vue` | `useSite()` (мета, контакты, реквизиты) + `GET /api/home` (`home-page`: каталог, услуги, преимущества, шаги, цифры, FAQ); вёрстка и классы — макет `docs/sait-13` |
| Каталог | `app/pages/katalog/index.vue` | `GET /api/catalog` |
| Раздел каталога | `app/pages/katalog/[category].vue` | `GET /api/catalog/{slug}` |
| Посадочная (39) | `app/pages/arenda-[slug].vue` | `GET /api/landing?typeSlug=&citySlug=` |
| Услуги | `app/pages/uslugi/index.vue` | `GET /api/services` |
| Услуга | `app/pages/uslugi/[slug].vue` | `GET /api/services/{slug}` |
| Статическая страница | `app/pages/[slug].vue` | `GET /api/pages/{slug}` (в т.ч. политика ПДн) |
| Контакты | `app/pages/kontakty.vue` | `useSite()` |
| Ошибки | `app/error.vue` | `NuxtError` |

Остальные публичные роуты: `GET /api/site`, `POST /api/leads`, `/robots.txt`, `/sitemap.xml`, `/uploads/**`.
Заявка пишется в БД и уходит в CRM (ADR-5), `LEADS_DRY_RUN=true` по умолчанию (ADR-18).

**Целевая структура главной — `docs/specs/home.md`:** 18 блоков, готовые тексты, источники данных, приоритеты
P0–P2 и открытые вопросы. Там же зафиксировано, что из этого уже есть, а что расходится с ТЗ (форма в hero,
цена в карточке вида, CTA до FAQ).

**DTO** — `app/types/catalog.ts` (`SiteDto`, `HomeDto`, `CategoryDetailDto`, `LandingDto`, `ServiceDetailDto`, `PageDto`).
**Композаблы:** `useSite`, `usePageSeo` (мета + canonical), `useJsonLd`, `throwIfError`.
**Утилиты:** `price.ts` (`formatPrice`, `formatPriceFrom`, `PRICE_UNIT_LABEL`), `routes.ts` (`typePath`, `categoryPath`,
`servicePath`), `phone.ts` (`telHref`), `plural.ts` (`pluralRu` — «3 вида», «12 видов»).
**Компоненты:** `SiteHeader`, `SiteFooter`, `SiteBreadcrumbs`, `CatalogGrid`, `CtaBlock`, `FaqList`,
`SiteButton` (внутренняя ссылка — `to`, внешняя и `tel:` — `href`; `variant` `primary`/`ghost`,
`tone` `light`/`dark`/`on-brand`), `SiteIcon` (встроенный набор контурных иконок, неизвестное имя → `shield`),
`SectionHead` (моно-кикер с линией, `h2` и лид; `h1` остаётся только в hero страницы).

Главная объявляет `definePageMeta({ layout: false })`: вёрстка макета приносит свою шапку и подвал, глобальный
layout на главной не участвует. Остальные страницы живут в `layout` с `.page-main > .container`.

**Состояние на 19.11.2026 (контрольная точка).** Главная — перенос `docs/sait-13/dist/index.html`
(разметка, классы, порядок секций, свой `style.css` из `public/landing/`) с заменённым содержимым:
тексты, каталог, услуги, преимущества, шаги, цифры и FAQ приходят из `GET /api/home`,
контакты и реквизиты — из `useSite()`, всё редактируется в админке. Поведение — `app/utils/landing.ts`,
заявка — в `POST /api/leads`. Ссылки на каталог, виды и услуги строятся только через `~/utils/routes`
(`categoryPath`, `typePath`, `servicePath`). Каскад выправлен: правила каркаса, пересекавшиеся с макетом,
лежат в `@layer` и под меткой `body.landing-page`. Фотографии — демонстрационные (`docs/images-demo.md`).
**Следующий шаг — очередь §4: каталог `/katalog` и раздел.**

## 3. Стили и токены

Tailwind CSS 4.3.5 через `@tailwindcss/vite` (ADR-7). Порядок CSS в `nuxt.config.ts`:
`~/assets/css/tailwind.css` → `~/assets/css/main.css`.

Токены — `app/assets/css/tailwind.css` (`@theme`):

| Токен | Значение | Утилиты |
|---|---|---|
| `--color-brand` / `-dark` / `-soft` | `#0f5c9c` / `#0b4575` / `#e9f1f8` | `bg-brand`, `text-brand-dark`, `bg-brand-soft` |
| `--color-ink` / `--color-muted` | `#1b1f24` / `#5b6773` | `text-ink`, `text-muted` |
| `--color-line` | `#dfe4ea` | `border-line`, `divide-line` |
| `--color-surface` / `-soft` | `#ffffff` / `#f4f6f8` | `bg-surface`, `bg-surface-soft` |
| `--color-accent` | `#e8a33d` | `text-accent`, `bg-accent` (акценты CTA) |
| `--color-brand-light` | `#2f8fd8` | `bg-brand-light`, моно-номера и акценты на тёмных полосах |
| `--color-brand-bright` | `#1a6fb5` | светлый край градиента кнопок (с белым текстом 5.2:1) |
| `--color-void` / `--color-night` / `--color-night-2` | `#04070a` / `#070c12` / `#0c141c` | `bg-void`, `bg-night`, `bg-night-2` — тёмные полосы |
| `--color-panel` / `--color-line-dark` | `#111d28` / `#22303c` | `bg-panel`, `border-line-dark` — карточки и разделители на тёмном |
| `--color-mist` / `--color-snow` | `#93a6b5` / `#eef4f8` | `text-mist` (вторичный текст), `text-snow` (заголовки на тёмном) |
| `--color-concrete` | `#f1f4f6` | `bg-concrete` — холодная светлая полоса (каталог, FAQ) |
| `--container-site` | `77.5rem` (1240px) | `max-w-site`; боковые поля страниц — `px-5` (20px) → `md:px-8` (32px) |
| `--radius-card` / `--radius-field` | `10px` / `8px` | `rounded-card`, `rounded-field` |
| `--shadow-card` / `--shadow-bar` | мягкая тень / линия | `shadow-card`, `shadow-bar` |

Фоновая «инженерная» сетка тёмных полос — переменные `:root` `--site-grid` (шаг 72px) и `--site-grid-brand`
(поверх синей CTA-полосы); подключаются утилитой `[background-image:var(--site-grid)]`, отдельного класса нет.
Палитра и порядок полос — по референсу заказчика `docs/sait-13`, решение — ADR-22.

**Правила:**
- Публичные компоненты — только утилиты Tailwind; новые глобальные классы для сайта не добавляем.
- `app/assets/css/main.css` — стили админки и остатки каркаса. Переверстанный блок сразу удаляем из него.
- Остатки публичных классов в `main.css`: `.container`, `.page-main`, `.muted`, `.lead`, `.grid`, `.card`,
  `.table-wrap`, `.table`, `.price`, `.badge`, `.breadcrumbs`, `.button`, `.error-page`, `.section`.
  Их время ещё не пришло — не удалять, пока экран не переверстан.
- Mobile-first; брейкпоинты Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- **Базовая типографика каркаса живёт в `@layer base`** (`main.css`: `h1`…`h3`, `p`). Правила вне слоёв
  сильнее любых утилит Tailwind (утилиты лежат в `@layer utilities`), поэтому размеры и `margin` заголовков
  без слоя молча перебивали `text-[clamp(…)]` и `mt-*`. Значения в `base` оставлены прежними — они держат
  ещё не переверстанные страницы; переверстанные задают размеры и отступы утилитами (`mb-0` там, где
  нужен сброс базового отступа).
- Доступность: `:focus-visible` уже задан в базе, аккордеоны — `<details>`, мобильное меню — тоже `<details>`
  (работает без JS), интерактив — не меньше 44×44 px.

## 4. Очередь работ

- [x] Tailwind 4 + токены (`app/assets/css/tailwind.css`)
- [x] Каркас: `SiteHeader` (мобильное меню на `<details>`) и `SiteFooter` на утилитах; CSS шапки/подвала удалён
- [ ] `SiteBreadcrumbs`, `.button`, `error.vue` — на утилиты; убрать `.breadcrumbs`, `.button`, `.error-page`
- [x] Главная по брифу `docs/specs/home.md` (19.11.2026): блоки в порядке ТЗ, форма в hero и CTA
  (`LeadForm` → `POST /api/leads`), «Какие задачи закрываем», «Парк и база», «Как устроена аренда»,
  «Стоимость аренды» (таблица «раздел → видов → цена от» + факторы), «Договор, документы и гарантии»,
  «Работаем в Москве и области», FAQ из 11 вопросов, CTA до FAQ. Тексты блоков — из брифа,
  демо-контент (услуги, преимущества, шаги, цифры, FAQ, цены «от») живёт в `prisma/seed.ts`
  и обновляется повторным `npm run db:seed`
  - ⚠️ Ответы FAQ про ГСМ, НДС, подмену и физлиц, таблица условий и гарантии про ТО/простой —
    проект решения: публикуем после подтверждения заказчиком (см. §8 и `TODO.md`)
  - 19.11.2026 — метрики приведены к числам `docs/sait-13/src/style.css`: контейнер 1240 + поля 20/32,
    ритм секций 56 → 84, hero 40/56 → 64/84, H1 `clamp(1.9rem,5.2vw,3.5rem)`, акцент hero
    `clamp(1.6rem,3.6vw,2.6rem)`, H2 `clamp(1.5rem,3.4vw,2.35rem)`, лид `clamp(1rem,1.4vw,1.115rem)`,
    полоса условий `py-[clamp(1.5rem,3.2vw,2.5rem)]` с иконкой 25.6px без плашки,
    цифры — отдельными карточками (radius 14, padding 24/20, центр)
  - 19.11.2026 — главная переведена на перенос макета 1:1: `app/pages/index.vue` повторяет
    `docs/sait-13/dist/index.html` (разметка, классы, тексты, порядок секций) со своими шапкой и подвалом,
    `layout: false`, стили — `/landing/style.css` (сборка референса без изменений, `public/landing/`),
    поведение — `app/utils/landing.ts` (reveal, `<details>`-меню, табы, маска телефона, форма, шкала разделов).
    Форма в `#zayavka` отправляется в `POST /api/leads` (`place="landing-form"`), статус — из макета.
    Композиция по брифу `home.md` остаётся планом наполнения: тексты и фото макета — заглушки (Q-08)
  - 19.11.2026 — содержимое макета заменено данными сайта: `GET /api/home` (`home-page`) отдаёт каталог,
    услуги, преимущества, шаги, цифры доверия и FAQ из БД, контакты и реквизиты — `useSite()`; классы,
    идентификаторы секций и порядок блоков макета сохранены. Ссылки на разделы, виды и услуги строятся
    только через `~/utils/routes`; фото — демо из `public/landing/images/tech/`, реестр с лицензиями —
    `docs/images-demo.md`
- [ ] Каталог: `/katalog` и раздел — карточки с ценой, `seoTextHtml`, крошки
- [ ] Посадочная `/arenda-{type}-v-{city}`: цена и условия, таблица моделей, работы, похожая техника, FAQ, SEO-текст
- [ ] Услуги: список и карточка (изображение, `contentHtml`, FAQ)
- [ ] Контакты, политика ПДн (страница из БД), 404
- [~] Формы заявок: `POST /api/leads` + `LeadForm` (honeypot, состояния успеха/ошибки, UTM из адреса)
  готовы; на главной работает форма макета (`place="landing-form"`), `LeadForm` ждёт подключения
  на контактах и посадочных
- [ ] Изображения: `@nuxt/image` 2.2.1 + `<NuxtImg>` (ресайз, WebP, `sizes`, ленивая загрузка); источники — `/uploads/**` и `photos[]` моделей
  - 19.11.2026 — на главной пока демонстрационные WebP (`public/landing/images/tech/`, 1600 px, q62);
    заменяются собственными снимками по Q-08 один к одному, без правки разметки.
    Авторы и лицензии — `docs/images-demo.md`
- [ ] Аналитика: `site.metrikaId` (сейчас `NUXT_PUBLIC_METRIKA_ID` не используется), цели на формы и клики, отключение в dev
- [ ] Playwright: «форма → БД → CRM (mock)» и «вход в админку»

## 5. Контракты, которые нельзя ломать

- **URL без завершающего слеша** (ADR-6); смена слагов даёт 301 через карту `Redirect` — ссылки строим только через `routes.ts`.
- **SEO на каждой странице:** ровно один `<h1>`, мета и canonical — через `usePageSeo`, JSON-LD — `useJsonLd` с фиксированным ключом
  (`Organization` в layout, `BreadcrumbList`, `FAQPage` в `FaqList`, `Product` на посадочной). Дубли ключей ломают разметку.
- **Деньги — строки** (`Decimal` в БД): не приводить к числу на клиенте, форматировать `formatPrice`/`formatPriceFrom`.
- **Заявка:** сначала `Lead` в БД, затем CRM (ADR-5); валидация одна на форму и API. Ошибку CRM пользователю не показываем как потерю заявки.
- **Публичного кэша нет** — изменения из админки видны сразу; не включать ISR/`cache` на публичных маршрутах.
- **Админка** живёт на `main.css` и `/api/admin/**`; правки публичных стилей не должны её задевать.
- `@nuxt/image` и Playwright — уже согласованный стек (`docs/stack.md`), других зависимостей не добавлять без согласия.

## 6. Окружение и команды

```bash
cd /Users/webserfer/repositories/spectechresource
nvm use                  # Node 24 обязателен: на v20 падают nuxt и prisma
npm run db:up            # PostgreSQL в Docker, хост-порт 5433 (5432 занят другим проектом)
npm run dev              # http://localhost:3000
npm run lint && npm run test && npm run typecheck && npm run build
```

**Грабли, проверенные на этой машине:**
- Docker daemon после перезагрузки выключен → `open -a Docker`, дождаться `docker info`, затем `npm run db:up`.
- Фоновый dev-сервер запускать только так: `nohup npm run dev </dev/null > /tmp/dev.log 2>&1 &` —
  без `</dev/null` Nuxt ждёт клавиши, получает `SIGTTIN` и встаёт (`ps` показывает `STAT T`).
- Собранный сервер (`node .output/server/index.mjs`) **не читает `.env`**: перед смоуком
  `set -a; . ./.env; set +a`, иначе `DATABASE_URL не задан` → 500.
- Смоук-набор (демо-данные сида): `/`, `/katalog`, `/katalog/zemleroynaya-tehnika`,
  `/arenda-gusenichnogo-ekskavatora-v-moskva`, `/uslugi`, `/uslugi/zemlyanye-raboty`, `/kontakty`,
  `/admin/login`, `/robots.txt`, `/sitemap.xml` — все должны отдавать 200.
- Шаблонные проверки: `curl -s -o /dev/null -w '%{http_code}'`; HTML — `grep -o '<h1[^>]*>[^<]*'`.
- Замеры вёрстки без зрения (адаптив, размеры, отступы): временный скрипт во `/tmp` по CDP —
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9222
  --user-data-dir=/tmp/chrome-measure about:blank`, затем Node 24 (`WebSocket` встроен) с
  `Emulation.setDeviceMetricsOverride` (375/768/1280) и `Runtime.evaluate` по `getBoundingClientRect()`
  и `getComputedStyle()`. Проверка горизонтали — `documentElement.scrollWidth` против `innerWidth`.
  В репозиторий такой скрипт не кладём: приёмка дизайна всё равно за владельцем.

## 7. Definition of Done для итерации

- [ ] Только утилиты Tailwind; новых глобальных классов в `main.css` нет, переверстанные правила удалены.
- [ ] Адаптив проверен на 375, 768 и 1280 px; ничего не выезжает по горизонтали.
- [ ] SEO сохранён: один `<h1>`, `usePageSeo` с canonical без слеша, JSON-LD без дублей.
- [ ] Нет «мёртвых» ссылок на удалённые классы: `grep -rn '<class-из-main.css>' app/`.
- [ ] `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` — зелёные.
- [ ] Смоук-набор из §6 отдаёт 200, в логе сервера нет ошибок.
- [ ] Коммит `feat(front): <экран> — <что сделано>`; отчёт: что проверено, что нет и почему.

## 8. Открытые вопросы (влияют на вёрстку)

| # | Вопрос | Что блокирует |
|---|---|---|
| Q-08 | Парк: позиции, модели, характеристики, цены, фото; логотип | Реальные карточки, галереи, hero-фон; демо-набор главной и его лицензии — `docs/images-demo.md` |
| Q-10 | Финальный текст политики ПДн и версия согласия | Страница политики, чекбокс в форме |
| Q-01 | Один город или несколько | Переключатель города, тексты H1 |
| — | Брендовые цвета и шрифт | Сейчас палитра выведена из старого каркаса (`#0f5c9c`), легко меняется в `@theme` |

## 9. История

- 15.11.2026 — `seo-routing`: публичные страницы, API, мета, JSON-LD, 301, robots и sitemap; вёрстка техническая.
- 16.11.2026 — `admin-*` слайсы закрыты; все публичные данные редактируются в админке.
- 16.11.2026 — коммит `c3b99b0`: Tailwind 4.3.5, токены, `SiteHeader` и `SiteFooter` на утилитах.
- 19.11.2026 — главная пересобрана по метрикам `docs/sait-13` (контейнер 1240, ритм 56/84, шкала H1/H2/лида,
  полоса преимуществ, карточки цифр); базовая типографика `main.css` перенесена в `@layer base`.
- 19.11.2026 — главная наполнена данными сайта: `GET /api/home` + `useSite()`, вёрстка и классы макета сохранены,
  ссылки — только через `routes.ts`, фотографии — демонстрационные (`docs/images-demo.md`).
- Дальше — по очереди §4.

## 10. Старт нового чата

Скопировать в первое сообщение:

> Читай `AGENTS.md`, `docs/specs/front.md`, §5 в `TODO.md`. Мы делаем публичный фронтенд в полуручном режиме:
> дизайн-решения и приёмка за мной, ты реализуешь по одному экрану за итерацию с планом до и проверками после.
> Каркас (Tailwind-токены, шапка, подвал) готов и закоммичен в `c3b99b0`. Продолжаем с пункта, отмеченного
> первым невыполненным в §4 спеки.

Проверить до первой правки: `git log --oneline -5`, `git status`, порт 3000 свободен (`lsof -ti:3000`),
контейнер БД поднят (`docker ps --filter name=spectech-postgres`), в `docs/specs/front.md` §4 актуальный чек-лист.

## 11. Журнал итераций

| Дата | Что сделано | Коммит |
|---|---|---|
| 16.11.2026 | Tailwind 4.3.5, токены `@theme`, шапка и подвал на утилитах | `c3b99b0` |
| 17.11.2026 | Эта спека: зафиксировано состояние, правила, очередь и грабли окружения | — |
| 18.11.2026 | Главная: тёмный hero с цифрами доверия, полоса преимуществ, каталог карточками, услуги, шаги, FAQ, CTA; компоненты `SiteButton`, `SiteIcon`, `SectionHead`, `fullBleed` в layout; `CatalogGrid`, `CtaBlock`, `FaqList` на утилитах | — |
| 19.11.2026 | Главная по числам референса: контейнер `1240px` + поля 20/32, ритм секций 56 → 84, hero 40/56 → 64/84, H1 `1.9→3.5rem`, акцент `1.6→2.6rem`, H2 `1.5→2.35rem`, лид `1→1.115rem`, полоса условий с иконкой 25.6px, карточки цифр (radius 14). Типографика `main.css` перенесена в `@layer base` — утилиты больше не перебиваются; замеры 375/768/1280 через headless Chrome | — |
| 19.11.2026 | Главная по брифу `home.md`: `LeadForm` в hero (`place="hero"`) и в `#zayavka` (`place="callback"`), блоки «Задачи», «Парк и база», «Как устроена аренда», «Стоимость аренды», «Документы и гарантии», «География», FAQ 11 вопросов после CTA; тексты заголовков и лидов приведены к брифу, демо-контент синхронизирован в `prisma/seed.ts` (идемпотентный сид). Проверки: `test` 292 ✅, `typecheck` ✅, `lint` ✅, `/` 200 и все блоки в SSR | — |
| 19.11.2026 | Главная — перенос макета `docs/sait-13` 1:1 и починка каскада. Причина «поехавшей» вёрстки: правила `main.css` вне `@layer` (`body`, `a`, `img`, `.lead`, `.grid`, `.field`) перебивали макет — страница рисовалась системным шрифтом на белом фоне, ссылки синими, сетки — `auto-fill`. Что сделано: правила переведены в `@layer base`/`@layer components`, `.lead`/`.grid` и `text-wrap` ограничены `body:not(.landing-page)`; ссылка на `/landing/style.css` ставится последней в `<head>` (`moveStyleLast`) — иначе dev-режим Vite вставляет CSS приложения тегами `<style>` после неё; импорт CSS через сборщик отклонён: он попадал в общий чанк страниц и тёмный `body` макета протекал на `/uslugi` и другие маршруты. Плюс исправлены пути картинок `images/kompetencii/*` → `/landing/images/…` (были 404) и форма `#zayavka` подключена к `POST /api/leads` (`place="landing-form"`). Сверка через CDP `getComputedStyle`: `body`, ссылки, `.lead`, `.grid`, `.field`, `.panel--form`, `.shot__img` — совпадают с `docs/sait-13/dist/index.html` в dev и в `preview`; `/uslugi` не получает стилей макета; маска, табы, успешная и ошибочная отправка проверены в headless Chrome (`test` 292 ✅, `typecheck` ✅, `lint` ✅, `build` ✅) | — |

| 19.11.2026 | Главная наполнена данными сайта: `GET /api/home` (`home-page`) — каталог (39 видов в таблице цен и в «Популярном»), услуги, преимущества, шаги, цифры, FAQ (11 вопросов); контакты и реквизиты — `useSite()`. Классы, идентификаторы секций, `/landing/style.css` и `app/utils/landing.ts` не менялись. Ссылки на разделы, виды и услуги — только через `~/utils/routes` (`categoryPath`, `typePath`, `servicePath`), неиспользуемый `data-form-slug` убран. Добавлены демо-фото `public/landing/images/tech/` (12 WebP, реестр с лицензиями — `docs/images-demo.md`). Проверки: `lint` ✅, `typecheck` ✅, `build` ✅; CDP-смоук 375/768/1280 — горизонтального переполнения нет, 21 раздел в шкале со scroll-spy без битых якорей, 3 группы табов по одной активной панели, 39 строк цен, 7 строк документов, 11 вопросов FAQ, 0 битых картинок, 0 неудачных запросов, один `h1`, canonical/description/FAQPage JSON-LD на месте, порядок секций по макету, пустая отправка формы → ошибка, валидная → «Заявка отправлена» | `b8a3b4f` |

При завершении итерации — добавить строку сюда и отметить пункт в §4.
