# Спека слайса `quality` — линтер и unit-тесты

| | |
|---|---|
| Статус | ✅ реализовано 15.11.2026 |
| Слайс | `@nuxt/eslint` + ESLint 10 (flat config), Vitest 5, 36 unit-тестов, скрипты `lint`/`test`/`typecheck` |
| Не входит | Playwright/e2e, тесты API с БД, `vue-tsc` (проверка `.vue`), покрытие кодом, CI |

## Зачем

`AGENTS.md` §2 требует тестов и линтера для каждой задачи, §6 п.4 — подтверждать готовность API тестами.
До этого слайса в проекте не было ни того, ни другого: готовность `seo-routing` подтверждалась только `curl`.
Слайс закрывает эту дыру **до** появления записи в БД (`leads`), где цена ошибки выше.

## Что сделано

| Файл | Назначение |
|---|---|
| `eslint.config.mjs` | flat config через `withNuxt()`; игнорируются `generated/` и `docs/` |
| `vitest.config.ts` | `tests/**/*.test.ts`, окружение `node`, алиасы `~`/`@` → `app/`, `~~`/`@@` → корень |
| `tests/markdown.test.ts` | 12 кейсов: экранирование HTML, заголовки, списки, цитаты, ссылки, CRLF, пустой ввод |
| `tests/dto.test.ts` | 8 кейсов: `money`, `toCity`, `toTypeCard`, `toSite` (полный набор ключей), `toFaq` |
| `tests/price.test.ts` | 9 кейсов: `formatMoney`/`formatPrice`/`formatPriceFrom`, `PRICE_UNIT_LABEL`, неразрывный пробел |
| `tests/phone.test.ts` | 3 кейса: `telHref` для `+7…`, `8…`, чистых цифр |
| `tests/routes.test.ts` | 4 кейса: ЧПУ посадочной без слеша, раздел, услуга |
| `package.json` | `lint`, `lint:fix`, `test`, `test:watch`, `typecheck` |

## Команды

```bash
npm run lint       # eslint . — 0 ошибок, 0 предупреждений
npm run test       # vitest run — 36 тестов
npm run typecheck  # tsc --noEmit по .nuxt/tsconfig.server.json и .nuxt/tsconfig.app.json
npm run build      # SSR-сборка не сломана
```

## Решения, принятые по ходу

1. **TypeScript 5.9.3 вместо 7.0.2** (ADR-15): `typescript-eslint@8.72` / `ts-api-utils@2.5` падают
   на TS 7 с `TypeError: Cannot read properties of undefined (reading 'Intrinsic')`.
2. **`vue/no-v-html` отключён для `app/**/*.vue`** (ADR-14): единственный источник `v-html` — `seoTextHtml`/
   `worksPerformedHtml`/контент страниц из `server/utils/markdown.ts`, где HTML экранируется; это покрыто
   тестами `tests/markdown.test.ts`.
3. **`Breadcrumbs.vue` → `SiteBreadcrumbs.vue`**: правило `vue/multi-word-component-names`, заодно совпадает
   с `SiteHeader`/`SiteFooter`.
4. **Тесты только на чистых функциях** (ADR-16): без `@nuxt/test-utils` и без БД, чтобы `npm test` шёл < 1 с.
   Тесты API — в слайсе `leads` через сервисный слой.

## Проверено 15.11.2026

- `npm run lint` — чисто; `npm run test` — 36/36; `npm run typecheck` — без ошибок.
- `npx nuxt build` — успешно; preview на `:3999`: `/katalog/zemleroynaya-tehnika`,
  `/arenda-gusenichnogo-ekskavatora-v-moskva`, `/politika-obrabotki-personalnyh-dannyh` — 200,
  один `<h1>`, `BreadcrumbList` на месте (переименование компонента не сломало авто-импорт).
- Лог сервера чистый.

## Ограничения (осознанные)

- `.vue` не проверяются типами: `vue-tsc` — в слайсе фронтенда, когда вернёмся к UI.
- Нет e2e (Playwright) и тестов с реальной БД.
- Нет покрытия (coverage) и CI — решаем вместе с деплоем.
- `telHref` не обрабатывает добавочные номера и 10-значные номера без кода страны; нормализация
  `+7XXXXXXXXXX` для формы заявки появится в `server/utils/phone.ts` слайса `leads`.
