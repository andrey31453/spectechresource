<script setup lang="ts">
import type { FetchError } from "ofetch";
import { nextTick, ref } from "vue";
import { safeParse } from "valibot";
import { LeadSchema, toLeadFieldErrors, type LeadPlace } from "#shared/schemas/leads";
import { buildLeadPayload, createRequestId } from "~/mail-form/payload";
import { readLeadPageContext, type LeadSourceContext } from "~/utils/lead-source";

/**
 * Форма заявки публичных страниц. Валидация — та же схема, что у `POST /api/leads`
 * (`shared/schemas/leads.ts`), поэтому правила и тексты ошибок не расходятся.
 *
 * `place` различает блоки формы в журнале заявок: `hero` — первый экран,
 * `callback` — полоса «Не нашли технику?». Остальные поля схемы (UTM, адрес
 * страницы, `requestId`, honeypot) собираются автоматически.
 */
const props = withDefaults(
  defineProps<{
    place: LeadPlace;
    equipmentTypeSlug?: string;
    equipmentModelId?: string;
    source?: LeadSourceContext;
    /** Виды техники для выпадающего списка; в CTA список не нужен. */
    equipmentTypes?: Array<{ slug: string; name: string }>;
    heading?: string;
    lead?: string | null;
    submitLabel?: string;
    note?: string | null;
    /** Телефон для запасного пути, если отправка не удалась. */
    phone?: string | null;
  }>(),
  {
    equipmentTypeSlug: undefined,
    equipmentModelId: undefined,
    source: undefined,
    equipmentTypes: () => [],
    heading: "Расчёт за смену",
    lead: "Подберём технику под задачу и назовём цену с доставкой.",
    submitLabel: "Получить расчёт",
    note: null,
    phone: null,
  },
);

type LeadErrorPayload = {
  message?: string;
  data?: { errors?: Array<{ field: string; message: string }> };
};

const route = useRoute();

const formEl = ref<HTMLFormElement | null>(null);
const name = ref("");
const phoneInput = ref("");
const emailInput = ref("");
const comment = ref("");
const selectedTypeSlug = ref("");
const consent = ref(false);
const honeypot = ref("");
const requestId = ref(createRequestId());

const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const sent = ref(false);

const fieldClass =
  "mt-1 w-full rounded-field border bg-surface px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none";
const errorClass = "mt-1 block text-xs text-red-600";

function clearError(field: string) {
  if (!errors.value[field]) return;

  errors.value = Object.fromEntries(
    Object.entries(errors.value).filter(([key]) => key !== field),
  );
}

function applyErrors(issues: Array<{ field: string; message: string }>) {
  const next: Record<string, string> = {};

  for (const issue of issues) {
    if (issue.field === "_form") {
      formError.value = issue.message;
    } else {
      next[issue.field] = issue.message;
    }
  }

  errors.value = next;
  void nextTick(() => formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
}

function handleError(error: unknown) {
  const fetchError = error as FetchError<LeadErrorPayload>;
  const issues = fetchError.data?.data?.errors ?? [];

  if (fetchError.statusCode === 400 && issues.length) {
    applyErrors(issues);
    return;
  }

  if (fetchError.statusCode === 429) {
    formError.value =
      fetchError.data?.message ?? "Слишком много заявок с этого адреса. Позвоните нам.";
    return;
  }

  formError.value = "Не удалось отправить заявку. Позвоните нам или попробуйте ещё раз.";
}

async function submit() {
  if (pending.value) return;

  errors.value = {};
  formError.value = null;

  const source = props.source ?? readLeadPageContext();
  const payload = buildLeadPayload({
    place: props.place,
    name: name.value,
    phone: phoneInput.value,
    email: emailInput.value,
    comment: comment.value,
    consent: consent.value,
    pageUrl: source.pageUrl ?? window.location.href,
    sourceLabel: source.sourceLabel,
    sourceButton: source.sourceButton ?? props.submitLabel,
    requestId: requestId.value,
    equipmentTypeSlug: props.equipmentTypeSlug ?? selectedTypeSlug.value,
    equipmentModelId: props.equipmentModelId,
    honeypot: honeypot.value,
    pageTitle: source.pageTitle ?? document.title,
    referer: document.referrer,
    query: route.query,
  });

  const parsed = safeParse(LeadSchema, payload);
  if (!parsed.success) {
    applyErrors(toLeadFieldErrors(parsed.issues));
    return;
  }

  pending.value = true;

  try {
    await $fetch("/api/leads", { method: "POST", body: parsed.output });
    sent.value = true;
    requestId.value = createRequestId();
  } catch (error) {
    handleError(error);
  } finally {
    pending.value = false;
  }
}

function resetForm() {
  name.value = "";
  phoneInput.value = "";
  emailInput.value = "";
  comment.value = "";
  selectedTypeSlug.value = "";
  consent.value = false;
  honeypot.value = "";
  errors.value = {};
  formError.value = null;
  requestId.value = createRequestId();
  sent.value = false;

  void nextTick(() => formEl.value?.querySelector<HTMLInputElement>("input")?.focus());
}
</script>

<template>
  <form
    :id="`lead-${place}`"
    ref="formEl"
    class="relative scroll-mt-24 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
    novalidate
    @submit.prevent="submit"
  >
    <div v-if="sent" role="status" class="flex flex-col items-start gap-3">
      <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <SiteIcon name="check" class="h-5 w-5" />
      </span>
      <p class="text-[clamp(1.1rem,2vw,1.35rem)] font-bold text-ink">Заявка отправлена</p>
      <p class="text-sm leading-relaxed text-muted">
        Свяжемся в рабочее время, обычно в течение 30 минут.
        <template v-if="phone">
          Если вопрос срочный —
          <a :href="telHref(phone)" class="font-semibold text-brand">{{ phone }}</a>.
        </template>
      </p>
      <button
        type="button"
        class="text-sm font-semibold text-brand underline underline-offset-2"
        @click="resetForm"
      >
        Отправить ещё одну заявку
      </button>
    </div>

    <template v-else>
      <p class="text-[clamp(1.1rem,2vw,1.35rem)] leading-snug font-bold text-ink">{{ heading }}</p>
      <p v-if="lead" class="mt-1.5 text-sm leading-relaxed text-muted">{{ lead }}</p>

      <div class="mt-5 grid gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-xs font-semibold text-muted">Имя (необязательно)</span>
            <input
              :id="`lead-${place}-name`"
              v-model="name"
              type="text"
              name="name"
              autocomplete="name"
              placeholder="Как к вам обращаться"
              :class="[fieldClass, errors.name ? 'border-red-500' : 'border-line']"
              :aria-invalid="Boolean(errors.name)"
              :aria-describedby="errors.name ? `lead-${place}-name-error` : undefined"
              @input="clearError('name')"
            >
            <span
              v-if="errors.name"
              :id="`lead-${place}-name-error`"
              :class="errorClass"
              role="alert"
            >
              {{ errors.name }}
            </span>
          </label>

          <label class="block">
            <span class="text-xs font-semibold text-muted">Телефон</span>
            <input
              :id="`lead-${place}-phone`"
              v-model="phoneInput"
              type="tel"
              name="phone"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+7 (999) 123-45-67"
              :class="[fieldClass, errors.phone ? 'border-red-500' : 'border-line']"
              :aria-invalid="Boolean(errors.phone)"
              :aria-describedby="errors.phone ? `lead-${place}-phone-error` : undefined"
              @input="clearError('phone')"
            >
            <span
              v-if="errors.phone"
              :id="`lead-${place}-phone-error`"
              :class="errorClass"
              role="alert"
            >
              {{ errors.phone }}
            </span>
          </label>
        </div>
        <label class="block">
          <span class="text-xs font-semibold text-muted">E-mail</span>
          <input
            :id="`lead-${place}-email`"
            v-model="emailInput"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="name@example.ru"
            :class="[fieldClass, errors.email ? 'border-red-500' : 'border-line']"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? `lead-${place}-email-error` : undefined"
            @input="clearError('email'); clearError('phone')"
          >
          <span v-if="errors.email" :id="`lead-${place}-email-error`" :class="errorClass" role="alert">{{ errors.email }}</span>
        </label>
        <label v-if="equipmentTypes.length" class="block">
          <span class="text-xs font-semibold text-muted">Техника</span>
          <select
            :id="`lead-${place}-equipment`"
            v-model="selectedTypeSlug"
            name="equipmentTypeSlug"
            :class="[fieldClass, 'border-line']"
          >
            <option value="">Не знаю — нужна консультация</option>
            <option v-for="type in equipmentTypes" :key="type.slug" :value="type.slug">
              {{ type.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-muted">Комментарий</span>
          <textarea
            :id="`lead-${place}-comment`"
            v-model="comment"
            name="comment"
            rows="2"
            placeholder="Объект, адрес, сроки"
            :class="[fieldClass, errors.comment ? 'border-red-500' : 'border-line']"
            :aria-invalid="Boolean(errors.comment)"
            :aria-describedby="errors.comment ? `lead-${place}-comment-error` : undefined"
            @input="clearError('comment')"
          />
          <span
            v-if="errors.comment"
            :id="`lead-${place}-comment-error`"
            :class="errorClass"
            role="alert"
          >
            {{ errors.comment }}
          </span>
        </label>

        <div>
          <label class="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
            <input
              v-model="consent"
              type="checkbox"
              name="consent"
              class="mt-0.5 h-6 w-6 shrink-0 rounded border-line accent-brand"
              :aria-invalid="Boolean(errors.consent)"
              :aria-describedby="errors.consent ? `lead-${place}-consent-error` : undefined"
            >
            <span>
              Согласен на обработку персональных данных по
              <NuxtLink
                to="/politika-obrabotki-personalnyh-dannyh"
                class="inline-flex min-h-6 items-center text-brand underline underline-offset-2 hover:text-brand-dark"
                >политике</NuxtLink
              >
            </span>
          </label>
          <span
            v-if="errors.consent"
            :id="`lead-${place}-consent-error`"
            :class="errorClass"
            role="alert"
          >
            {{ errors.consent }}
          </span>
        </div>

        <label
          class="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <span>Не заполняйте это поле</span>
          <input v-model="honeypot" type="text" name="honeypot" tabindex="-1" autocomplete="off" >
        </label>
      </div>

      <p
        v-if="formError"
        class="mt-4 rounded-field border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700"
        role="alert"
      >
        {{ formError }}
        <template v-if="phone">
          Позвоните:
          <a :href="telHref(phone)" class="font-semibold underline">{{ phone }}</a>.
        </template>
      </p>

      <SiteButton
        type="submit"
        variant="primary"
        tone="dark"
        class="mt-5 w-full"
        :disabled="pending"
      >
        {{ pending ? "Отправляем…" : submitLabel }}
      </SiteButton>
      <p v-if="note" class="mt-3 text-xs leading-relaxed text-muted">{{ note }}</p>
    </template>
  </form>
</template>
