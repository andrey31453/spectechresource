import type { H3Event } from "h3";
import * as v from "valibot";
import { toFieldErrors } from "#shared/schemas/errors";

/**
 * Обвязка админ-API каталога: тело → схема, ошибки в том же формате, что у публичных API
 * (`data.errors: [{ field, message }]`), и короткие конструкторы 404/409.
 */

/** 400 с ошибками по полям — клиент подсвечивает их у ввода. */
export function throwValidationError(issues: readonly v.BaseIssue<unknown>[], message = "Проверьте поля"): never {
  throw createError({
    statusCode: 400,
    statusMessage: "Bad Request",
    message,
    data: { errors: toFieldErrors(issues) },
  });
}

/** 400 с одной ошибкой, привязанной к полю формы. */
export function throwFieldError(field: string, message: string): never {
  throw createError({
    statusCode: 400,
    statusMessage: "Bad Request",
    message: "Проверьте поля",
    data: { errors: [{ field, message }] },
  });
}

/** Тело запроса, проверенное схемой; при ошибке — 400 с полями. */
export async function readValidBody<S extends v.GenericSchema>(event: H3Event, schema: S): Promise<v.InferOutput<S>> {
  const body = await readBody(event);
  const parsed = v.safeParse(schema, body ?? {});

  if (!parsed.success) {
    throwValidationError(parsed.issues);
  }

  return parsed.output;
}

/** Идентификатор из пути; пустой сегмент невозможен, но типы этого не знают. */
export function requirePathParam(event: H3Event, name = "id"): string {
  const value = String(getRouterParam(event, name) ?? "").trim();

  if (!value) {
    throw createError({ statusCode: 404, message: "Запись не найдена" });
  }

  return value;
}

export function throwNotFound(message: string): never {
  throw createError({ statusCode: 404, statusMessage: "Not Found", message });
}

/** Конфликт состояния: занятый код, непустой раздел и т.п. */
export function throwConflict(message: string): never {
  throw createError({ statusCode: 409, statusMessage: "Conflict", message });
}
