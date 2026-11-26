<script setup lang="ts">
import { LEAD_STATUS_LABELS } from "#shared/schemas/leads-filters";
import { formatLeadDateTime } from "#shared/utils/leads-format";
import type { AdminLeadDto, AdminLeadRetryResponse } from "~/types/admin-leads";
import { leadPlaceLabel, leadStatusBadgeClass } from "~/utils/admin-leads";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Заявка · админка",
  robots: "noindex, nofollow",
});

const route = useRoute();
const id = computed(() => String(route.params.id ?? ""));
const requestFetch = useRequestFetch();

const { data, error } = await useAsyncData(`admin-lead-${id.value}`, () =>
  requestFetch<{ lead: AdminLeadDto }>(`/api/admin/leads/${id.value}`),
);
throwIfError(error.value);

const lead = computed(() => data.value?.lead ?? null);

if (!lead.value) {
  throw createError({ statusCode: 404, message: "Заявка не найдена" });
}

const { formError, pending, submit, reset } = useAdminForm();
const notice = ref<string | null>(null);

/** Успешную заявку не повторяем: в CRM появился бы дубль лида. */
const retryBlocked = computed(() => lead.value?.status === "SENT");

const utmRows = computed(() => {
  const item = lead.value;
  if (!item) return [];

  return [
    { label: "utm_source", value: item.utmSource },
    { label: "utm_medium", value: item.utmMedium },
    { label: "utm_campaign", value: item.utmCampaign },
    { label: "utm_content", value: item.utmContent },
    { label: "utm_term", value: item.utmTerm },
  ].filter((row) => Boolean(row.value));
});

async function retry() {
  notice.value = null;
  reset();

  const result = await submit(() =>
    $fetch<AdminLeadRetryResponse>(`/api/admin/leads/${id.value}/retry`, { method: "POST" }),
  );

  if (!result) return;

  data.value = { lead: result.lead };
  notice.value = result.ok
    ? "Заявка отправлена в CRM."
    : `CRM не приняла заявку: ${result.delivery.error ?? "неизвестная ошибка"}. Заявка осталась в базе, попытка записана.`;
}
</script>

<template>
  <div v-if="lead" class="admin-page lead-card">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <NuxtLink to="/admin/leads">Заявки</NuxtLink>
          <span>/</span>
          <span>#{{ lead.id.slice(-6) }}</span>
        </div>
        <h1 class="admin-page__title">Заявка от {{ formatLeadDateTime(lead.createdAt) }}</h1>
        <p class="admin-page__lead">
          {{ lead.name }} · <a :href="`tel:${lead.phone}`">{{ lead.phone }}</a>
          <template v-if="lead.equipmentTypeName"> · {{ lead.equipmentTypeName }}</template>
        </p>
      </div>
      <div class="admin-page__actions">
        <span :class="leadStatusBadgeClass(lead.status)">{{ LEAD_STATUS_LABELS[lead.status] }}</span>
        <NuxtLink to="/admin/leads" class="button button--ghost">К списку</NuxtLink>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>

    <section class="lead-card__section">
      <h2 class="lead-card__title">Контакт</h2>
      <dl class="lead-card__grid">
        <div class="lead-card__row">
          <dt class="lead-card__term">Имя</dt>
          <dd class="lead-card__value">{{ lead.name }}</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Телефон</dt>
          <dd class="lead-card__value"><a :href="`tel:${lead.phone}`">{{ lead.phone }}</a></dd>
        </div>
        <div v-if="lead.email" class="lead-card__row">
          <dt class="lead-card__term">E-mail</dt>
          <dd class="lead-card__value"><a :href="`mailto:${lead.email}`">{{ lead.email }}</a></dd>
        </div>
      </dl>
      <div v-if="lead.comment" class="lead-card__comment">
        <p class="lead-card__term">Комментарий</p>
        <p class="lead-card__value lead-card__value--pre">{{ lead.comment }}</p>
      </div>
    </section>

    <section class="lead-card__section">
      <h2 class="lead-card__title">Откуда заявка</h2>
      <dl class="lead-card__grid">
        <div v-if="lead.sourceLabel" class="lead-card__row">
          <dt class="lead-card__term">Источник</dt>
          <dd class="lead-card__value">{{ lead.sourceLabel }}</dd>
        </div>
        <div v-if="lead.sourceButton" class="lead-card__row">
          <dt class="lead-card__term">Кнопка</dt>
          <dd class="lead-card__value">{{ lead.sourceButton }}</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Форма</dt>
          <dd class="lead-card__value">{{ leadPlaceLabel(lead.place) }} <span class="muted">({{ lead.place }})</span></dd>
        </div>
        <div v-if="lead.equipmentTypeName" class="lead-card__row">
          <dt class="lead-card__term">Техника</dt>
          <dd class="lead-card__value">{{ lead.equipmentTypeName }}</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Страница</dt>
          <dd class="lead-card__value">
            <a :href="lead.pageUrl" target="_blank" rel="noopener">{{ lead.pageTitle || lead.pageUrl }}</a>
            <div class="muted">{{ lead.pageUrl }}</div>
          </dd>
        </div>
        <div v-if="lead.referer" class="lead-card__row">
          <dt class="lead-card__term">Referer</dt>
          <dd class="lead-card__value"><span class="muted">{{ lead.referer }}</span></dd>
        </div>
      </dl>

      <dl v-if="utmRows.length" class="lead-card__grid lead-card__utm">
        <div v-for="row in utmRows" :key="row.label" class="lead-card__row">
          <dt class="lead-card__term">{{ row.label }}</dt>
          <dd class="lead-card__value">{{ row.value }}</dd>
        </div>
      </dl>
    </section>


    <section class="lead-card__section">
      <h2 class="lead-card__title">Согласие на обработку ПДн</h2>
      <dl class="lead-card__grid">
        <div class="lead-card__row">
          <dt class="lead-card__term">Дано</dt>
          <dd class="lead-card__value">{{ formatLeadDateTime(lead.consentAt) }} (МСК)</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Редакция политики</dt>
          <dd class="lead-card__value">{{ lead.consentVersion }}</dd>
        </div>
      </dl>
    </section>

    <section class="lead-card__section">
      <h2 class="lead-card__title">Доставка в CRM</h2>
      <dl class="lead-card__grid">
        <div class="lead-card__row">
          <dt class="lead-card__term">Статус</dt>
          <dd class="lead-card__value">
            <span :class="leadStatusBadgeClass(lead.status)">{{ LEAD_STATUS_LABELS[lead.status] }}</span>
          </dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Попыток</dt>
          <dd class="lead-card__value">{{ lead.attempts }}</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Отправлена</dt>
          <dd class="lead-card__value">{{ lead.sentAt ? `${formatLeadDateTime(lead.sentAt)} (МСК)` : "—" }}</dd>
        </div>
        <div v-if="lead.crmLeadId" class="lead-card__row">
          <dt class="lead-card__term">ID лида в CRM</dt>
          <dd class="lead-card__value">{{ lead.crmLeadId }}</dd>
        </div>
      </dl>

      <p v-if="lead.errorText" class="lead-card__error">{{ lead.errorText }}</p>

      <div class="admin-form__actions">
        <button type="button" class="button" :disabled="pending || retryBlocked" @click="retry">
          {{ pending ? "Отправляем…" : "Повторить отправку" }}
        </button>
        <span v-if="retryBlocked" class="field__hint">Заявка уже принята CRM — повтор создал бы дубль лида.</span>
        <span v-else class="field__hint">
          Отправка идёт с ретраями и таймаутом; при ошибке текст ответа CRM сохранится здесь.
        </span>
      </div>
    </section>

    <section class="lead-card__section">
      <h2 class="lead-card__title">Служебное</h2>
      <dl class="lead-card__grid">
        <div class="lead-card__row">
          <dt class="lead-card__term">ID заявки</dt>
          <dd class="lead-card__value"><code>{{ lead.id }}</code></dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Идентификатор запроса</dt>
          <dd class="lead-card__value"><code>{{ lead.requestId }}</code></dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Создана</dt>
          <dd class="lead-card__value">{{ formatLeadDateTime(lead.createdAt) }} (МСК)</dd>
        </div>
        <div class="lead-card__row">
          <dt class="lead-card__term">Обновлена</dt>
          <dd class="lead-card__value">{{ formatLeadDateTime(lead.updatedAt) }} (МСК)</dd>
        </div>
        <div v-if="lead.ip" class="lead-card__row">
          <dt class="lead-card__term">IP</dt>
          <dd class="lead-card__value">{{ lead.ip }}</dd>
        </div>
        <div v-if="lead.userAgent" class="lead-card__row">
          <dt class="lead-card__term">User-Agent</dt>
          <dd class="lead-card__value">{{ lead.userAgent }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

