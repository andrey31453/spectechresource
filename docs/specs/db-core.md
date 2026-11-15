# Спека: каркас БД (слайс `db-core`), v1

| | |
|---|---|
| Статус | **на ревью** — миграция не создавалась |
| Слайс | схема PostgreSQL (Prisma) + Prisma Client + сид справочника каталога |
| Не входит | API, страницы, авторизация (только таблицы), реальный контент заказчика |

## Готово, когда (после вашего «ок»)

1. `prisma validate` проходит без ошибок.
2. `prisma migrate dev --name init` создаёт все таблицы в локальной БД (Docker).
3. `prisma db seed` наполняет: 8 разделов, 39 видов техники, 5 услуг, демо-блоки главной.
4. Повторный запуск сида не создаёт дублей (upsert по `slug`).
5. `prisma studio` показывает данные; цена везде `null` → в UI «цена по запросу».

## Сущности (16 моделей)

| Модель | Назначение | Ключевые ограничения |
|---|---|---|
| `Category` | раздел каталога (8 шт.) | `slug` unique, `sortOrder` |
| `EquipmentType` | вид техники = посадочная (39 шт.) | `slug` unique, `nameGenitive` для H1, `priceFrom Int?` |
| `EquipmentModel` | модель в таблице на посадочной | unique `(typeId, brand, model)` |
| `EquipmentSpec` | характеристика модели (строка таблицы) | каскад от модели |
| `RelatedType` | «Похожая техника» (ручная перелинковка) | составной PK `(sourceId, targetId)` |
| `Service` | услуга (5 шт., P1) | `slug` unique |
| `FaqItem` | вопрос-ответ для FAQPage | `scope` + nullable FK на вид/услугу |
| `Advantage` | блок «Преимущества» | `sortOrder`, `isPublished` |
| `WorkStep` | «Порядок работы» (4 шага) | `sortOrder` |
| `TrustStat` | 3 цифры на главной | `value`, `unit`, `label` |
| `SiteSettings` | singleton: телефон, мессенджеры, реквизиты, город | `id = "main"` |
| `Page` | статические страницы (политика ПДн) | `slug` unique |
| `Redirect` | карта 301 при смене ЧПУ | `from` unique |
| `Lead` | заявка (очередь в CRM) | `requestId` unique, `status`, `attempts` |
| `AdminUser` | пользователь админки | `email` unique, `passwordHash` (argon2id) |
| `AdminSession` | сессия админки в БД | `tokenHash` unique, `expiresAt` |

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

## Соглашения

- `id` — `cuid()`, таблицы в `snake_case` через `@@map`, поля `camelCase`.
- Деньги — `Int` в рублях; `null` = «цена по запросу» (никаких выдуманных цен).
- SEO-поля (`seoTitle`, `seoDescription`, `seoText`) дублируются на `Category`, `EquipmentType`,
  `Service`, `Page`. Пустое значение = мета собирается по шаблону в приложении.
- `gallery` / `photos` — `String[]` с путями; сами файлы вне БД.
- Удаление: дочерние сущности каталога — `Cascade`; `Lead` не теряет историю (`SetNull` на ссылках).
- `createdAt` / `updatedAt` — на всех редактируемых сущностях.
- Падежи: `EquipmentType.nameGenitive` («гусеничного экскаватора») и `SiteSettings.cityIn`
  («Москве») — H1 строится без кода на каждый вид.

## Индексы

`unique`: все `slug`, `Lead.requestId`, `AdminUser.email`, `Redirect.from`, `(typeId, brand, model)`.
`index`: `(categoryId, sortOrder)`, `(status, createdAt)` у заявок, `expiresAt` у сессий.

## Сид: что наполняем

- 8 разделов и 39 видов — данные из `docs/tz-structured.md` §6 (slug, название, падеж, порядок).
- 5 услуг, по 2 вопроса FAQ на 3–4 популярных вида, 4 преимущества, 4 шага, 3 цифры.
- `SiteSettings`: заглушки (город «Москва» / «Москве», телефон, дисклеймер про смену 8 часов).
- Модели техники — 1–2 демо-строки, чтобы таблица не была пустой; реальные — через админку.

## Требует вашего подтверждения

| # | Вопрос | Рекомендация |
|---|---|---|
| 1 | Деньги: `Int` рубли или `Decimal` | `Int` — копейки в аренде не нужны |
| 2 | Сессии админки: в БД или только cookie | **в БД** — можно отозвать доступ |
| 3 | `FaqItem`: два nullable FK или полиморфизм | два FK — проще и типизированно |
| 4 | Город: поля в `SiteSettings` или таблица `City` | поля сейчас; таблица — если городов станет >1 |
| 5 | Нужны ли `Page` и `Redirect` в v1 | да — дешёво и сразу снимает будущие 301 |
