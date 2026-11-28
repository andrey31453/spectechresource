# Спека слайса `leads` — приём заявок и доставка в Битрикс24

## Источник заявки — 24.11.2026

При открытии формы фиксируются URL, заголовок страницы, `sourceLabel` (главная,
товар/категория с названием либо другая страница) и `sourceButton` (доступное имя
или текст кнопки открытия). Карточка имеет приоритет перед страницей; фильтр
каталога учитывается. Для встроенной формы источник фиксируется при отправке,
кнопка — submit-label. Снимок не смешивается с комментарием посетителя.
Оба новых поля необязательны, до 300 символов, пустые — null; сохраняются в Lead,
видны в карточке админки, CSV и CRM, в том числе при повторной отправке. Старые
клиенты совместимы. Приёмка: главная, товар, категория, фильтр, кнопка шапки,
встроенная форма; контекст предыдущего открытия не переносится. Проверки:
unit, lint, typecheck, build и браузерный payload без реальной отправки в CRM.

## Контракт контактов — 24.11.2026

Имя необязательно (если заполнено — 2–80 символов). Телефон и email необязательны
по отдельности, но хотя бы один контакт должен быть заполнен и корректен. Пустые
контакты нормализуются в `null` общей схемой; для совместимости с существующей БД
отсутствующие имя и телефон сохраняются как пустые строки. CRM-маппинг не отправляет
пустые NAME/PHONE и использует «Без имени» в заголовке. Остальные гарантии сохранены:
сначала БД, идемпотентность, явное согласие, rate limit и dry-run.

28.11.2026: добавлен независимый канал Rusender, получатель для проверки —
`andrey31453@gmail.com`, отправитель — `info@specteh.online`.
Настройка и ограничения — `docs/specs/mail-form.md`; Битрикс24 пока в dry-run.
Исторические проверки ниже относятся к прежнему контракту обязательных имени/телефона.

| | |
|---|---|
| Статус | ✅ реализовано 15.11.2026 |
| Слайс | `POST /api/leads` → `Lead` → CRM (Битрикс24), valibot-схема для формы и сервера, задача досылки |
| Не входит | формы на клиенте (слайс фронтенда), админ-список заявок и кнопка «повторить», полноценная авторизация |

## Контракт `POST /api/leads`

Тело — JSON. Схема одна на клиент и сервер: `shared/schemas/leads.ts`.

| Поле | Обяз. | Правило |
|---|---|---|
| `name` | да | строка 2–80 символов после `trim` |
| `phone` | да | любые разделители, 10 цифр или 11 с 7/8 → нормализуется в `+7XXXXXXXXXX` |
| `email` | нет | `null`/пустая строка → `null`; иначе проверка вида `name@example.ru` |
| `comment` | нет | до 2000 символов |
| `consent` | да | строго `true`: без согласия заявку не принимаем |
| `place` | да | `hero` · `callback` · `landing-form` · `equipment` · `contacts` · `footer` |
| `pageUrl` | да | `http://` или `https://`, до 2048 символов |
| `pageTitle` | нет | до 200 символов |
| `referer` | нет | до 2048 символов |
| `utmSource` … `utmTerm` | нет | до 200 символов каждая |
| `equipmentTypeSlug` | нет | код вида техники; неизвестный slug не ошибка — сохраняем заявку без связи |
| `requestId` | да | UUID, идемпотентность повторной отправки |
| `honeypot` | нет | заполнено → отвечаем `201 { ok: true }`, заявку не создаём |

Ответы:

| Код | Когда | Тело |
|---|---|---|
| `201` | заявка создана (в т.ч. не ушла в CRM) | `{ ok: true }` |
| `200` | повтор с тем же `requestId` | `{ ok: true, duplicate: true }` |
| `400` | схема не прошла | `{ message: "Проверьте поля формы", data: { errors: [{ field, message }] } }` |
| `429` | больше 10 заявок с одного IP за 10 минут | `Retry-After` в секундах |

Клиент **не** может подменить `consentAt`, `consentVersion`, `ip`, `userAgent`, `status`: их ставит сервер.

## Что сохраняем в `Lead`

`requestId`, `name`, `phone`, `email`, `comment`, `place`, `pageUrl`, `pageTitle`, `referer`,
`utm*`, `equipmentTypeId` (по slug), `consentAt = now()`, `consentVersion` из `LEADS_CONSENT_VERSION`,
`ip` (`x-forwarded-for` → сокет), `userAgent`, `status = NEW`, `attempts`, `sentAt`, `crmLeadId`, `errorText`.

## Доставка в CRM

1. Заявка **сначала** пишется в БД, потом отправляется (ADR-5): недоступная CRM не теряет лид.
2. Отправка — входящий вебхук `crm.lead.add.json`: `mapLeadToBitrix()` собирает `TITLE`, `NAME`,
   `PHONE`, `EMAIL`, `COMMENTS` (комментарий, форма, страница, техника, время), `SOURCE_ID = WEB`, UTM-поля.
3. Таймаут попытки 5 с, всего 3 попытки с паузами 300 и 600 мс. Ошибка Битрикса в теле `200 OK`
   тоже считается неудачей — сохраняем `errorText` (до 300 символов), статус `FAILED`.
4. Успех → `status = SENT`, `sentAt`, `crmLeadId`, `attempts += n`.
5. Пустой `BITRIX24_WEBHOOK_URL` → попыток нет, заявка остаётся `NEW` с пояснением в `errorText`.

**Режим без отправки.** `LEADS_DRY_RUN` включён по умолчанию (`true`); выключается только явным `false`.
В dry-run заявка сохраняется, `attempts += 1`, статус остаётся `NEW`, в CRM ничего не уходит.

**Досылка.** Nitro-задача `leads:send` (`server/tasks/leads/send.ts`) берёт до 20 заявок
со статусом `NEW`/`FAILED` и `attempts < 6` и повторяет отправку. Задачи включены в `nuxt.config.ts`
(`nitro.experimental.tasks`). Запуск: `npx nuxi task run leads:send` (в dev — с `--url http://localhost:3000`);
расписание — вместе с деплоем. Кнопка «повторить» в админке появится в слайсе `admin` (нужна авторизация).

## Защита от мусора

- **Honeypot**: невидимое поле; заполнено → тихий `201` без записи.
- **Идемпотентность**: `requestId` unique; `P2002` → `200 { duplicate: true }` (двойной клик, ретрай сети).
- **Rate limit**: 10 заявок / 10 минут на IP, в памяти процесса Nitro. Счётчики общие для инстанса,
  при рестарте обнуляются; за балансировщиком нужен Redis — отмечено как ограничение, не блокер.
- **Валидация строгая**: неизвестные поля отбрасываются, лишние данные в БД не попадают.

## Файлы

| Файл | Назначение |
|---|---|
| `shared/utils/phone.ts` | `normalizePhone`, `isNormalizedPhone`; `app/utils/phone.ts::telHref` переиспользует |
| `shared/schemas/leads.ts` | `LeadSchema`, `LEAD_PLACES`, `LeadInput`, `toLeadFieldErrors` |
| `server/utils/rate-limit.ts` | `hitRateLimit` (Map + окно), `resetRateLimit` для тестов |
| `server/utils/bitrix.ts` | `mapLeadToBitrix`, `sendLeadToBitrix` (таймаут, ретраи, разбор ответа) |
| `server/utils/leads.ts` | `buildLeadCreateData`, `toCrmLead`, `crmLeadFromRecord`, `deliverLead`, `isDryRun`, `isUniqueViolation` |
| `server/utils/leads-delivery.ts` | связка Prisma + CRM для роута и задачи |
| `server/api/leads.post.ts` | HTTP-контракт, rate limit, honeypot, идемпотентность |
| `server/tasks/leads/send.ts` | задача `leads:send` — досылка очереди |
| `tests/lead-schema.test.ts`, `tests/phone.test.ts` | схема, нормализация, ошибки по полям |
| `tests/bitrix.test.ts`, `tests/lead-delivery.test.ts`, `tests/rate-limit.test.ts` | маппинг, ретраи, dry-run, лимитер |

## Проверено 15.11.2026 (dev на `:3999`, `LEADS_DRY_RUN=true`)

- Валидная заявка → `201 { ok: true }`; в БД одна строка: `phone = +79991234567`, `place = equipment`,
  `status = NEW`, `attempts = 1`, `consentVersion = 2026-11-15`, заполнены `ip`, `userAgent`, `utmSource`,
  `equipmentTypeId` (slug `gusenichnogo-ekskavatora` найден).
- Повтор с тем же `requestId` → `200 { duplicate: true }`, второй строки нет.
- Заявка без имени/с плохим телефоном/без согласия → `400`, шесть ошибок с полями и русскими текстами.
- Honeypot → `201`, запись не создана.
- 11-я заявка с одного IP → `429`, `Retry-After: 586` (окно 10 минут).
- Задача `leads:send` (dev, `--url`) → `{ processed: 0, sent: 0, failed: 0, skipped: "LEADS_DRY_RUN" }`.
- `LEADS_DRY_RUN=false` + пустой вебхук → `201`, в БД `status = NEW`, `attempts = 0`,
  `errorText = "BITRIX24_WEBHOOK_URL не задан…"`, предупреждение в лог.
- Тестовые строки удалены, `select count(*) from leads` → 0.
- `npm run lint` — чисто; `npm test` — 85/85; `npm run typecheck` — без ошибок; `npm run build` — успешно.

## Ограничения (осознанные)

- `LEADS_DRY_RUN=true` по умолчанию: пока заказчик не даст вебхук (Q-07), заявки копятся в БД со статусом `NEW`.
- Текст и версия согласия (Q-10) — константа `LEADS_CONSENT_VERSION`, редакция политики фиксируется строкой.
- Срок хранения ПДн (`leads:purge`) — отдельный слайс, когда заказчик назовёт срок; экспорт CSV и повторная
  отправка готовы — `docs/specs/admin-leads.md`.
- Rate limit в памяти: для нескольких инстансов нужен общий стор (Redis) — меняется точечно в `rate-limit.ts`.
- Тесты — юнит (чистые функции и мок `fetch`); сквозной тест «форма → БД → CRM» — Playwright в слайсе фронтенда.
