import type {
  AdminAdvantageDto,
  AdminFaqDto,
  AdminTrustStatDto,
  AdminWorkStepDto,
  FaqScopeName,
} from "~/types/admin-content";

/**
 * Состояние форм контента ↔ тело админ-API.
 *
 * В форме всё строки (так работает `<input>`), сервер ждёт `null` вместо пустой строки.
 * FAQ дополнительно чистит привязку, которая не соответствует выбранной области:
 * общий вопрос не хранит ни вида, ни услуги.
 */

const text = (value: string | null): string => value ?? "";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

// ───────────────────────────────── FAQ ─────────────────────────────────

export interface FaqForm {
  scope: FaqScopeName;
  equipmentTypeId: string;
  serviceId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyFaqForm(): FaqForm {
  return {
    scope: "GLOBAL",
    equipmentTypeId: "",
    serviceId: "",
    question: "",
    answer: "",
    sortOrder: 10,
    isPublished: true,
  };
}

export function faqFormFrom(item: AdminFaqDto): FaqForm {
  return {
    scope: item.scope,
    equipmentTypeId: text(item.equipmentTypeId),
    serviceId: text(item.serviceId),
    question: item.question,
    answer: item.answer,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}

export function faqFormBody(form: FaqForm) {
  return {
    scope: form.scope,
    equipmentTypeId: form.scope === "TYPE" ? emptyToNull(form.equipmentTypeId) : null,
    serviceId: form.scope === "SERVICE" ? emptyToNull(form.serviceId) : null,
    question: form.question.trim(),
    answer: form.answer.trim(),
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
  };
}

// ────────────────────────────── Преимущества ──────────────────────────────

export interface AdvantageForm {
  title: string;
  text: string;
  icon: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyAdvantageForm(): AdvantageForm {
  return { title: "", text: "", icon: "", sortOrder: 10, isPublished: true };
}

export function advantageFormFrom(item: AdminAdvantageDto): AdvantageForm {
  return {
    title: item.title,
    text: text(item.text),
    icon: text(item.icon),
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}

export function advantageFormBody(form: AdvantageForm) {
  return {
    title: form.title.trim(),
    text: emptyToNull(form.text),
    icon: emptyToNull(form.icon),
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
  };
}

// ──────────────────────────── Порядок работы ────────────────────────────

export interface WorkStepForm {
  title: string;
  text: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyWorkStepForm(): WorkStepForm {
  return { title: "", text: "", sortOrder: 10, isPublished: true };
}

export function workStepFormFrom(item: AdminWorkStepDto): WorkStepForm {
  return {
    title: item.title,
    text: text(item.text),
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}

export function workStepFormBody(form: WorkStepForm) {
  return {
    title: form.title.trim(),
    text: emptyToNull(form.text),
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
  };
}

// ──────────────────────────────── Цифры ────────────────────────────────

export interface TrustStatForm {
  value: string;
  unit: string;
  label: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyTrustStatForm(): TrustStatForm {
  return { value: "", unit: "", label: "", sortOrder: 10, isPublished: true };
}

export function trustStatFormFrom(item: AdminTrustStatDto): TrustStatForm {
  return {
    value: item.value,
    unit: text(item.unit),
    label: item.label,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}

export function trustStatFormBody(form: TrustStatForm) {
  return {
    value: form.value.trim(),
    unit: emptyToNull(form.unit),
    label: form.label.trim(),
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
  };
}
