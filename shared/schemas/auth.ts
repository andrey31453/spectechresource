import * as v from "valibot";

/**
 * Схема входа в админку — одна для формы (`/admin/login`) и для `POST /api/admin/login`.
 * Политику сложности пароля проверяем при его **создании**, а не при входе:
 * иначе старый пароль, набранный до ужесточения правил, перестанет пускать.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const LOGIN_LIMITS = {
  email: 254,
  password: 200,
} as const;

export const LoginSchema = v.object({
  email: v.pipe(
    v.string("Укажите e-mail"),
    v.trim(),
    v.toLowerCase(),
    v.maxLength(LOGIN_LIMITS.email, `E-mail — не больше ${LOGIN_LIMITS.email} символов`),
    v.regex(EMAIL_RE, "Проверьте e-mail: нужен вид name@example.ru"),
  ),
  password: v.pipe(
    v.string("Введите пароль"),
    v.minLength(1, "Введите пароль"),
    v.maxLength(LOGIN_LIMITS.password, `Пароль — не больше ${LOGIN_LIMITS.password} символов`),
  ),
});

export type LoginInput = v.InferOutput<typeof LoginSchema>;
