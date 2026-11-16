import type * as v from "valibot";

/**
 * Ошибки valibot в плоский список `{ field, message }` — единый формат для всех API.
 * Поле верхнего уровня (`_form`) — ошибка, которую не к чему привязать в форме.
 */

export interface FieldError {
  field: string;
  message: string;
}

export function toFieldErrors(issues: readonly v.BaseIssue<unknown>[]): FieldError[] {
  return issues.map((issue) => ({
    field:
      (issue.path ?? [])
        .map((item) => String(item.key))
        .filter(Boolean)
        .join(".") || "_form",
    message: issue.message,
  }));
}
