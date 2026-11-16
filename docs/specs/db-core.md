# Спека: каркас БД (слайс `db-core`), v1

| | |
|---|---|
| Статус | **✅ реализовано и проверено 15.11.2026** (миграция `20261115162119_init`, сид выполнен дважды) |
| Слайс | схема PostgreSQL (Prisma) + Prisma Client + сид справочника каталога |
| Не входит | API, страницы, авторизация (только таблицы), реальный контент заказчика |

## Готово, когда — выполнено

| # | Критерий | Факт 15.11.2026 |
|---|---|---|
| 1 | `prisma validate` без ошибок | ✅ |
| 2 | `prisma migrate dev --name init` создаёт таблицы | ✅ `20261115162119_init` — 17 таблиц + `_prisma_migrations` |
| 3 | Сид наполняет справочник | ✅ 8 разделов, 39 видов, 5 услуг, 4 модели, 16 характеристик, 6 FAQ, 4 преимущества, 4 шага, 3 цифры, 1 страница |
| 4 | Повторный сид не создаёт дублей | ✅ второй запуск дал те же счётчики |
| 5 | Цена `null` → «цена по запросу» | ✅ `priceFrom` заполнен только у 2 демо-видов, у остальных `null` |

## Сущности (17 моделей)

| Модель | Назначение | Ключевые ограничения |
|---|---|---|
| `Category` | раздел каталога (8 шт.) | `slug` unique, `sortOrder` |
| `EquipmentType` | вид техники = посадочная (39 шт.) | `slug` unique (по ТЗ), `nameGenitive` для H1, `priceFrom Decimal(12,2)?` |
| `EquipmentModel` | модель в таблице на посадочной | unique `(typeId, brand, model)` |
| `EquipmentSpec` | характеристика модели (строка таблицы) | каскад от модели |
| `RelatedType` | «Похожая техника» (ручная перелинковка) | составной PK `(sourceId, targetId)` |
| `Service` | услуга (5 шт., P1) | `slug` unique |
| `FaqItem` | вопрос-ответ для FAQPage | `scope` + nullable FK на вид/услугу |
| `Advantage` | блок «Преимущества» | `sortOrder`, `isPublished` |
| `WorkStep` | «Порядок работы» (4 шага) | `sortOrder` |
| `TrustStat` | 3 цифры на главной | `value`, `unit`, `label` |
| `SiteSettings` | singleton: телефон, мессенджеры, реквизиты, `cityId` → `City` | `id = "main"` |
| `City` | город («Москва» / «Москве», `slug`, `isDefault`) | `slug` unique, один `isDefault` |
| `Page` | статические страницы (политика ПДн) | `slug` unique |
| `Redirect` | карта 301 при смене ЧПУ | `from` unique |
| `Lead` | заявка (очередь в CRM) | `requestId` unique, `status`, `attempts` |
| `AdminUser` | пользователь админки | `email` unique, `passwordHash` (scrypt, ADR-19) |
| `AdminSession` | сессия админки в БД | `tokenHash` unique (HMAC-SHA256), `expiresAt` |

## Отклонения от плоской структуры §4 ТЗ (осознанные)

| В ТЗ | В схеме | Почему |
|---|---|---|
| `specs[{name, value}]` | таблица `EquipmentSpec` | редактируется в админке как список строк, а не JSON |
| `relatedTypeIds[]` | таблица `RelatedType` | сохраняется порядок, ссылочная целостность |
| `mapCoords` | `mapLat`, `mapLng` | не нужно парсить строку |
| `requisites{name, inn, ogrn, legalAddress}` | плоские поля | singleton, вложенность ничего не даёт |
| `messengers{...}` | `telegram`, `whatsapp`, `maxMessenger` | то же |

## Технические детали Prisma 7

- Генератор `prisma-client`, клиент в `generated/prisma` (в `.gitignore`, не коммитим).
- `datasource` **без `url`**: строка подключения — в `prisma7.config.ts` (`datasource.url`
  из `process.env.DATABASE_URL`), файл создаём на шаге инициализации; нужен пакет `dotenv`.
- `.env` Prisma 7 сама не читает — только через `import "dotenv/config"` в конфиге.
- **Driver adapter обязателен** (ADR-11): `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
  Без него `PrismaClientInitializationError` — в Prisma 7 нет Rust-движка. Проверено на сиде.
- Файл конфига называется `prisma7.config.ts` (его читает CLI: «Loaded Prisma config from prisma7.config.ts»).

## Соглашения

- `id` — `cuid()`, таблицы в `snake_case` через `@@map`, поля `camelCase`.
- Деньги — `Decimal @db.Decimal(12,2)` (ADR-9); `null` = «цена по запросу» (никаких выдуманных цен).
- SEO-поля (`seoTitle`, `seoDescription`, `seoText`) дублируются на `Category`, `EquipmentType`,
  `Service`, `Page`. Пустое значение = мета собирается по шаблону в приложении.
- `gallery` / `photos` — `String[]` с путями; сами файлы вне БД.
- Удаление: дочерние сущности каталога — `Cascade`; `Lead` не теряет историю (`SetNull` на ссылках).
- `createdAt` / `updatedAt` — на всех редактируемых сущностях.
- Падежи: `EquipmentType.nameGenitive` («гусеничного экскаватора») и `City.nameIn`
  («Москве») — H1 строится без кода на каждый вид; `slug` вида — из ТЗ, в родительном падеже (ADR-12).

## Индексы

`unique`: все `slug`, `Lead.requestId`, `AdminUser.email`, `Redirect.from`, `(typeId, brand, model)`.
`index`: `(categoryId, sortOrder)`, `(status, createdAt)` у заявок, `expiresAt` у сессий.

## Сид: что наполняем

- 8 разделов и 39 видов — данные из `docs/tz-structured.md` §6 (slug, название, падеж, порядок).
- 5 услуг, по 2 вопроса FAQ на 3–4 популярных вида, 4 преимущества, 4 шага, 3 цифры.
- `SiteSettings`: заглушки (город «Москва» / «Москве», телефон, дисклеймер про смену 8 часов).
- Модели техники — 1–2 демо-строки, чтобы таблица не была пустой; реальные — через админку.

## Решения по вопросам из ревью (подтверждены заказчиком 15.11.2026)

| # | Вопрос | Решение |
|---|---|---|
| 1 | Деньги: `Int` рубли или `Decimal` | **`Decimal @db.Decimal(12,2)`** (ADR-9) |
| 2 | Сессии админки: в БД или только cookie | **в БД** (`AdminSession`), можно отозвать доступ |
| 3 | `FaqItem`: два nullable FK или полиморфизм | **два nullable FK** (`equipmentTypeId`, `serviceId`) |
| 4 | Город: поля в `SiteSettings` или таблица `City` | **таблица `City`** + `SiteSettings.cityId` (ADR-10) |
| 5 | Нужны ли `Page` и `Redirect` в v1 | **да** — дешёво и сразу снимает будущие 301 |

## Что осталось за рамками слайса

- Реальные контакты, реквизиты, фото и цены — от заказчика (сейчас ДЕМО-значения в сиде, помечены `ДЕМО`).
- Фабрика Prisma-клиента для Nitro (`server/utils/prisma.ts`) — в слайсе API: там же решается
  чтение `DATABASE_URL` через `runtimeConfig`.
- `RelatedType` («похожая техника») — таблица есть, данные заполняются в админке.
