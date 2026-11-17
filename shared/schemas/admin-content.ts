import * as v from "valibot";
import { optionalText, requiredText, sortOrderField } from "./catalog";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схемы контентных блоков — одни для админ-форм и админ-API.
 *
 * FAQ один и тот же для трёх мест: `GLOBAL` — главная и запасной вариант для посадочных,
 * `TYPE` — страница вида техники, `SERVICE` — страница услуги. Привязка хранится одной
 * ссылкой: `TYPE` → `equipmentTypeId`, `SERVICE` → `serviceId`, `GLOBAL` — без ссылок.
 *
 * Преимущества, шаги и цифры — плоские списки с порядком и публикацией.
 */

export const FAQ_SCOPES = ["GLOBAL", "TYPE", "SERVICE"] as const;

export type FaqScopeName = (typeof FAQ_SCOPES)[number];

export const FAQ_SCOPE_LABELS: Record<FaqScopeName, string> = {
  GLOBAL: "Общий — главная и запасной для посадочных",
  TYPE: "Вид техники",
  SERVICE: "Услуга",
};

const isPublishedField = v.boolean("Публикация — да или нет");

/** Ключ иконки — не путь к файлу: латиница в нижнем регистре, цифры и дефис. */
const ICON_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const iconField = v.optional(
  v.pipe(
    v.nullish(v.string()),
    v.transform((value) => {
      const text = typeof value === "string" ? value.trim().toLowerCase() : "";
      return text === "" ? null : text;
    }),
    v.check((value) => value === null || value.length <= 40, "иконка — не больше 40 символов"),
    v.check((value) => value === null || ICON_RE.test(value), "иконка: латиница в нижнем регистре, цифры и дефис"),
  ),
  null,
);

// ───────────────────────────────── FAQ ─────────────────────────────────

const faqFields = {
  scope: v.picklist(FAQ_SCOPES, "Неизвестная область показа"),
  equipmentTypeId: optionalText(40, "вид техники"),
  serviceId: optionalText(40, "услуга"),
  question: requiredText(300, "вопрос"),
  answer: requiredText(3000, "ответ"),
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export interface FaqTarget {
  scope: FaqScopeName;
  equipmentTypeId: string | null;
  serviceId: string | null;
}

/** Область требует привязки: `TYPE` — вид техники, `SERVICE` — услуга. */
export function faqTargetIssue(target: FaqTarget): FieldError | null {
  if (target.scope === "TYPE") {
    return target.equipmentTypeId ? null : { field: "equipmentTypeId", message: "Выберите вид техники" };
  }

  if (target.scope === "SERVICE") {
    return target.serviceId ? null : { field: "serviceId", message: "Выберите услугу" };
  }

  return null;
}

/** Лишние привязки не храним: у общего вопроса — ни вида, ни услуги. */
export function normalizeFaqTarget<T extends FaqTarget>(target: T): T {
  return {
    ...target,
    equipmentTypeId: target.scope === "TYPE" ? (target.equipmentTypeId ?? null) : null,
    serviceId: target.scope === "SERVICE" ? (target.serviceId ?? null) : null,
  };
}

/**
 * `PATCH` приходит частичным: недостающие привязки берём из сохранённой записи,
 * иначе смена области не пройдёт проверку. `undefined` — «не меняли», `null` — «очистили».
 */
export function mergeFaqTarget(existing: FaqTarget, patch: Partial<FaqTarget>): FaqTarget {
  return normalizeFaqTarget({
    scope: patch.scope ?? existing.scope,
    equipmentTypeId: patch.equipmentTypeId === undefined ? existing.equipmentTypeId : patch.equipmentTypeId,
    serviceId: patch.serviceId === undefined ? existing.serviceId : patch.serviceId,
  });
}

export const FaqCreateSchema = v.pipe(
  v.object({
    ...faqFields,
    sortOrder: v.optional(sortOrderField, 10),
    isPublished: v.optional(isPublishedField, true),
  }),
  v.transform(normalizeFaqTarget),
  v.forward(
    v.check((item) => item.scope !== "TYPE" || Boolean(item.equipmentTypeId), "Выберите вид техники"),
    ["equipmentTypeId"],
  ),
  v.forward(
    v.check((item) => item.scope !== "SERVICE" || Boolean(item.serviceId), "Выберите услугу"),
    ["serviceId"],
  ),
);

/** `partial` без transform: итоговые привязки проверяет хэндлер после слияния с записью. */
export const FaqUpdateSchema = v.partial(v.object(faqFields));

// ────────────────────────────── Преимущества ──────────────────────────────

const advantageFields = {
  title: requiredText(120, "заголовок преимущества"),
  text: optionalText(300, "текст преимущества"),
  icon: iconField,
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export const AdvantageCreateSchema = v.object({
  ...advantageFields,
  sortOrder: v.optional(sortOrderField, 10),
  isPublished: v.optional(isPublishedField, true),
});

export const AdvantageUpdateSchema = v.partial(v.object(advantageFields));

// ──────────────────────────── Порядок работы ────────────────────────────

const workStepFields = {
  title: requiredText(120, "название шага"),
  text: optionalText(300, "описание шага"),
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export const WorkStepCreateSchema = v.object({
  ...workStepFields,
  sortOrder: v.optional(sortOrderField, 10),
  isPublished: v.optional(isPublishedField, true),
});

export const WorkStepUpdateSchema = v.partial(v.object(workStepFields));

// ──────────────────────────────── Цифры ────────────────────────────────

/** Значение — строка («120», «12+», «4,9»), поэтому минимум 1 символ, а не 2. */
const statValueField = v.pipe(
  v.string("Укажите значение"),
  v.trim(),
  v.minLength(1, "Значение не может быть пустым"),
  v.maxLength(12, "значение — не больше 12 символов"),
);

const trustStatFields = {
  value: statValueField,
  unit: optionalText(20, "единица измерения"),
  label: requiredText(120, "подпись"),
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export const TrustStatCreateSchema = v.object({
  ...trustStatFields,
  sortOrder: v.optional(sortOrderField, 10),
  isPublished: v.optional(isPublishedField, true),
});

export const TrustStatUpdateSchema = v.partial(v.object(trustStatFields));

// ──────────────────────────────── Типы ────────────────────────────────

export type FaqCreateInput = v.InferOutput<typeof FaqCreateSchema>;
export type FaqUpdateInput = v.InferOutput<typeof FaqUpdateSchema>;
export type AdvantageCreateInput = v.InferOutput<typeof AdvantageCreateSchema>;
export type AdvantageUpdateInput = v.InferOutput<typeof AdvantageUpdateSchema>;
export type WorkStepCreateInput = v.InferOutput<typeof WorkStepCreateSchema>;
export type WorkStepUpdateInput = v.InferOutput<typeof WorkStepUpdateSchema>;
export type TrustStatCreateInput = v.InferOutput<typeof TrustStatCreateSchema>;
export type TrustStatUpdateInput = v.InferOutput<typeof TrustStatUpdateSchema>;

export type AdminContentFieldError = FieldError;

export const toAdminContentFieldErrors = toFieldErrors;
