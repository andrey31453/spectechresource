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
| Главная | `app/pages/index.vue` | `GET /api/home` |
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

**DTO** — `app/types/catalog.ts` (`SiteDto`, `HomeDto`, `CategoryDetailDto`, `LandingDto`, `ServiceDetailDto`, `PageDto`).
**Композаблы:** `useSite`, `usePageSeo` (мета + canonical), `useJsonLd`, `throwIfError`.
**Утилиты:** `price.ts` (`formatPrice`, `formatPriceFrom`, `PRICE_UNIT_LABEL`), `routes.ts` (`typePath`, `categoryPath`,
`servicePath`), `phone.ts` (`telHref`).
**Компоненты:** `SiteHeader`, `SiteFooter`, `SiteBreadcrumbs`, `CatalogGrid`, `CtaBlock`, `FaqList`.

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
| `--container-site` | `73.75rem` (1180px) | `max-w-site` |
| `--radius-card` / `--radius-field` | `10px` / `8px` | `rounded-card`, `rounded-field` |
| `--shadow-card` / `--shadow-bar` | мягкая тень / линия | `shadow-card`, `shadow-bar` |

**Правила:**
- Публичные компоненты — только утилиты Tailwind; новые глобальные классы для сайта не добавляем.
- `app/assets/css/main.css` — стили админки и остатки каркаса. Переверстанный блок сразу удаляем из него.
- Остатки публичных классов в `main.css`: `.container`, `.page-main`, `.muted`, `.lead`, `.grid`, `.card`,
  `.table-wrap`, `.table`, `.price`, `.badge`, `.breadcrumbs`, `.faq`, `.cta`, `.button`, `.error-page`,
  `.stats`, `.stat`, `.section`. Их время ещё не пришло — не удалять, пока экран не переверстан.
- Mobile-first; брейкпоинты Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Доступность: `:focus-visible` уже задан в базе, аккордеоны — `<details>`, мобильное меню — тоже `<details>`
  (работает без JS), интерактив — не меньше 44×44 px.

## 4. Очередь работ

- [x] Tailwind 4 + токены (`app/assets/css/tailwind.css`)
- [x] Каркас: `SiteHeader` (мобильное меню на `<details>`) и `SiteFooter` на утилитах; CSS шапки/подвала удалён
- [ ] `SiteBreadcrumbs`, `CtaBlock`, `.button`, `error.vue` — на утилиты; убрать `.breadcrumbs`, `.cta`, `.button`, `.error-page`
- [ ] Главная по блокам: hero (H1 + кнопки + цифры) → каталог → услуги → преимущества → шаги → FAQ → CTA
- [ ] Каталог: `/katalog` и раздел — карточки с ценой, `seoTextHtml`, крошки
- [ ] Посадочная `/arenda-{type}-v-{city}`: цена и условия, таблица моделей, работы, похожая техника, FAQ, SEO-текст
- [ ] Услуги: список и карточка (изображение, `contentHtml`, FAQ)
- [ ] Контакты, политика ПДн (страница из БД), 404
- [ ] Формы заявок: `POST /api/leads`, схема `shared/schemas/leads.ts`, honeypot, состояния успеха/ошибки, UTM из адреса
- [ ] Изображения: `@nuxt/image` 2.2.1 + `<NuxtImg>` (ресайз, WebP, `sizes`, ленивая загрузка); источники — `/uploads/**` и `photos[]` моделей
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
| Q-08 | Парк: позиции, модели, характеристики, цены, фото; логотип | Реальные карточки, галереи, hero-фон |
| Q-10 | Финальный текст политики ПДн и версия согласия | Страница политики, чекбокс в форме |
| Q-01 | Один город или несколько | Переключатель города, тексты H1 |
| — | Брендовые цвета и шрифт | Сейчас палитра выведена из старого каркаса (`#0f5c9c`), легко меняется в `@theme` |

## 9. История

- 15.11.2026 — `seo-routing`: публичные страницы, API, мета, JSON-LD, 301, robots и sitemap; вёрстка техническая.
- 16.11.2026 — `admin-*` слайсы закрыты; все публичные данные редактируются в админке.
- 16.11.2026 — коммит `c3b99b0`: Tailwind 4.3.5, токены, `SiteHeader` и `SiteFooter` на утилитах.
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

При завершении итерации — добавить строку сюда и отметить пункт в §4.



