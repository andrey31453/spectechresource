# Спека: вход в админку и защита `/admin` (слайс `admin-auth`), v1

| | |
|---|---|
| Статус | **✅ реализовано и проверено 15.11.2026** (dev `:3999`, 120 unit-тестов) |
| Слайс | сессия админки в БД, `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`, guard на весь `/api/admin/**` и `/admin/**` |
| Не входит | CRUD каталога, журнал заявок, смена пароля из UI, восстановление пароля по e-mail, 2FA |

## Контракт API

| Метод и путь | Доступ | Тело запроса | Успех |
|---|---|---|---|
| `POST /api/admin/login` | без сессии | `{ email, password }` | `200 { user }` + `Set-Cookie: admin_session` |
| `POST /api/admin/logout` | без сессии (идемпотентно) | — | `200 { ok: true }`, cookie сброшена |
| `GET /api/admin/me` | сессия | — | `200 { user }` |

`user` = `{ id, email, name, role }`, `role` ∈ `ADMIN` \| `EDITOR`. `passwordHash` и токен наружу не отдаются.

## Ошибки

| Код | Когда | Тело |
|---|---|---|
| `400` | valibot не пропустил поля | `{ message, data: { errors: [{ field, message }] } }` |
| `401` | нет/просрочена сессия, `isActive = false`, неверная пара e-mail+пароль | одинаковая формулировка: «Неверный e-mail или пароль» |
| `403` | небезопасный метод с чужим `Origin`; роль ниже требуемой | «Запрос с чужого источника отклонён» / «Недостаточно прав» |
| `429` | больше 8 попыток входа за 5 минут с одного IP | «Слишком много попыток входа…» + `Retry-After` |
| `503` | БД недоступна при проверке сессии | «Сервис временно недоступен» |

Формы входа не различают «нет такого e-mail» и «неверный пароль»: при отсутствии пользователя
всё равно выполняется scrypt-проверка против константы `DUMMY_PASSWORD_HASH`, чтобы время ответа не выдавало,
существует ли адрес.

## Сессия

- Токен: 32 случайных байта (`base64url`, 43 символа), в cookie `admin_session`.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` — на https, срок 7 дней.
- В БД (`admin_sessions`) только `tokenHash = HMAC-SHA256(SESSION_SECRET, token)` (без секрета — `sha256`),
  плюс `expiresAt`, `ip`, `userAgent`.
- Каждый запрос ищет строку в БД → выход и «отозвать все сессии» действуют мгновенно, `isActive = false`
  блокирует доступ без ожидания истечения токена. Просроченная строка удаляется при первой проверке.
- Смена пароля скриптом (`-- --update`) отзывает все сессии пользователя.

## Защита маршрутов

`server/middleware/admin-auth.ts` — один фильтр на весь префикс:

1. `/admin/login`, `POST /api/admin/login`, `POST /api/admin/logout` — публичные;
2. остальные `/api/admin/**` без сессии → `401` JSON; страницы `/admin/**` → `302 /admin/login?next=…`;
3. небезопасные методы (кроме `GET/HEAD/OPTIONS`) с чужим `Origin` → `403`;
4. ответы админки — `Cache-Control: no-store`; `event.context.admin` заполняется для хэндлеров;
   `requireAdmin(event, "ADMIN")` — проверка роли на будущих мутирующих эндпоинтах.
5. `/admin/login` при валидной сессии → `302 /admin`.

## Валидация

`shared/schemas/auth.ts` — `LoginSchema` (одна для формы и API): e-mail `trim` + `toLowerCase` + формат,
пароль 1…200 символов. Политика сложности применяется только при **создании** пароля
(`PASSWORD_LIMITS.min = 12`), иначе старые пароли перестали бы пускать.

## Файлы слайса

| Файл | Роль |
|---|---|
| `shared/schemas/auth.ts`, `shared/schemas/errors.ts` | схема входа, общий формат ошибок полей |
| `server/utils/password.ts` | scrypt: `hashPassword`, `verifyPassword`, `DUMMY_PASSWORD_HASH` |
| `server/utils/auth.ts` | токены, TTL, роли, guard-предикаты, cookie, CSRF (чистые функции) |
| `server/utils/admin-sessions.ts` | `createAdminSession`, `resolveAdminSession`, `revokeAdminSession`, `revokeAllAdminSessions` |
| `server/utils/admin-guard.ts` | `requireAdmin(event, role)` |
| `server/middleware/admin-auth.ts` | защита префиксов |
| `server/api/admin/{login,logout}.post.ts`, `me.get.ts` | эндпоинты |
| `scripts/create-admin.ts` (`npm run admin:create`) | создание админа и `--update` (сброс пароля + отзыв сессий) |
| `app/layouts/admin.vue`, `app/pages/admin/{login,index}.vue` | минимальный UI входа и дашборда |
| `tests/{password,auth,admin-sessions}.test.ts` | 35 тестов на хеширование, guard и операции с сессиями |

## Проверка 15.11.2026 (dev `http://localhost:3999`)

| Сценарий | Результат |
|---|---|
| `GET /api/admin/me` без cookie | `401`, `Cache-Control: no-store` |
| `POST /api/admin/login` неверный пароль | `401` «Неверный e-mail или пароль» |
| `POST /api/admin/login` битые поля | `400` + `errors[{email,password}]` |
| Успешный вход `Admin@Spectech.local ` | `200`, e-mail нормализован, cookie `HttpOnly; SameSite=Lax; Path=/; Expires +7 дней` |
| Строка в `admin_sessions` | `tokenHash` длиной 64, `ip = ::1`, `userAgent` сохранён, срок 7 дней |
| `GET /admin` без cookie / с cookie | `302 /admin/login?next=%2Fadmin` / `200`, в HTML e-mail и `noindex` |
| `GET /admin/login` с cookie | `302 /admin` |
| `POST /api/admin/unknown-endpoint` с валидной cookie и `Origin: https://evil.example` | `403` |
| `POST /api/admin/logout` → `me` | `200 { ok: true }` → `401`; в БД 0 сессий |
| 9 попыток входа с неверным паролем | после лимита `429` |
| `npm run admin:create -- --update` | пароль сменён, имя сохранено, отозвано 1 сессия, старый пароль → `401` |
| `npm run admin:create` для существующего без `--update` | отказ с подсказкой |
| `ADMIN_ROLE=OWNER` | отказ «только ADMIN или EDITOR» |

## Ограничения и следующий шаг

- Пароль меняется только скриптом; смена из UI и «выйти на всех устройствах» — вместе с разделом «Настройки».
- Лимит входа — в памяти Nitro (сбрасывается при рестарте, не общий для нескольких инстансов);
  при переезде на несколько инстансов — общий стор.
- Восстановление пароля по e-mail не делаем: сотрудников немного, сброс — командой.
- Следующий слайс — CRUD каталога (`/api/admin/catalog/**`) на `requireAdmin`.
