<script setup lang="ts">
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatusFilter } from "#shared/schemas/leads-filters";
import { formatLeadDateTime } from "#shared/utils/leads-format";
import type { AdminLeadsResponse } from "~/types/admin-leads";
import {
  LEAD_PLACE_LABELS,
  emptyLeadFilterState,
  leadExportUrl,
  leadFiltersQuery,
  leadPlaceLabel,
  leadStatusBadgeClass,
  type AdminLeadFilterState,
} from "~/utils/admin-leads";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Заявки · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

// Черновик фильтров отделён от применённых: поиск отправляется по кнопке/Enter, селекты — сразу.
const draft = reactive<AdminLeadFilterState>(emptyLeadFilterState());
const applied = reactive<AdminLeadFilterState>(emptyLeadFilterState());

const { data, error, pending } = await useAsyncData(
  "admin-leads",
  () => requestFetch<AdminLeadsResponse>("/api/admin/leads", { query: leadFiltersQuery(applied) }),
  { watch: [applied] },
);
throwIfError(error.value);

const leads = computed(() => data.value?.leads ?? []);
const counts = computed(() => data.value?.counts ?? { all: 0, NEW: 0, SENT: 0, FAILED: 0 });
const total = computed(() => data.value?.total ?? 0);
const page = computed(() => data.value?.page ?? 1);
const pages = computed(() => data.value?.pages ?? 1);
const exportUrl = computed(() => leadExportUrl(applied));

const statusTabs = computed(() => [
  { value: "all" as LeadStatusFilter, label: "Все", count: counts.value.all },
  ...LEAD_STATUSES.map((status) => ({
    value: status as LeadStatusFilter,
    label: LEAD_STATUS_LABELS[status],
    count: counts.value[status],
  })),
]);

function apply() {
  applied.status = draft.status;
  applied.place = draft.place;
  applied.from = draft.from;
  applied.to = draft.to;
  applied.q = draft.q;
  applied.page = 1;
}

function reset() {
  Object.assign(draft, emptyLeadFilterState());
  Object.assign(applied, emptyLeadFilterState());
}

function selectStatus(status: LeadStatusFilter) {
  draft.status = status;
  apply();
}

function goPage(next: number) {
  applied.page = Math.min(Math.max(1, next), pages.value);
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <span>Заявки</span>
        </div>
        <h1 class="admin-page__title">Заявки</h1>
        <p class="admin-page__lead">
          Каждая заявка сначала попадает в базу, потом уходит в Битрикс24. Ошибки CRM не теряют лид —
          их видно в статусе, отправку можно повторить из карточки.
        </p>
      </div>
      <div class="admin-page__actions">
        <a class="button button--ghost" :href="exportUrl">Экспорт CSV</a>
      </div>
    </div>

    <div class="admin-tabs" role="tablist" aria-label="Статус заявки">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="applied.status === tab.value"
        :class="['admin-tabs__item', { 'admin-tabs__item--active': applied.status === tab.value }]"
        @click="selectStatus(tab.value)"
      >
        {{ tab.label }} <span class="admin-tabs__count">{{ tab.count }}</span>
      </button>
    </div>

    <form class="lead-filters" @submit.prevent="apply">
      <label class="field lead-filters__search">
        <span class="field__label">Поиск</span>
        <input
          v-model="draft.q"
          class="field__input"
          type="search"
          name="q"
          placeholder="Имя, телефон или e-mail"
        >
      </label>

      <label class="field">
        <span class="field__label">Место формы</span>
        <select v-model="draft.place" class="field__input" name="place">
          <option value="">Любое</option>
          <option v-for="(label, place) in LEAD_PLACE_LABELS" :key="place" :value="place">{{ label }}</option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">С даты</span>
        <input v-model="draft.from" class="field__input" type="date" name="from">
      </label>

      <label class="field">
        <span class="field__label">По дату</span>
        <input v-model="draft.to" class="field__input" type="date" name="to">
      </label>

      <div class="lead-filters__actions">
        <button type="submit" class="button" :disabled="pending">
          {{ pending ? "Загружаем…" : "Показать" }}
        </button>
        <button type="button" class="button button--ghost" @click="reset">Сбросить</button>
        <span class="muted">Даты и время — по Москве.</span>
      </div>
    </form>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Создана</th>
            <th>Контакт</th>
            <th>Форма</th>
            <th>Страница</th>
            <th>Доставка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id">
            <td>
              <div>{{ formatLeadDateTime(lead.createdAt) }}</div>
              <div class="muted">#{{ lead.id.slice(-6) }}</div>
            </td>
            <td>
              <strong>{{ lead.name }}</strong>
              <div><a :href="`tel:${lead.phone}`">{{ lead.phone }}</a></div>
              <div v-if="lead.email" class="muted">{{ lead.email }}</div>
            </td>
            <td>
              {{ leadPlaceLabel(lead.place) }}
              <div v-if="lead.equipmentTypeName" class="muted">{{ lead.equipmentTypeName }}</div>
            </td>
            <td>
              <a :href="lead.pageUrl" target="_blank" rel="noopener">{{ lead.pageTitle || lead.pageUrl }}</a>
            </td>
            <td>
              <span :class="leadStatusBadgeClass(lead.status)">{{ LEAD_STATUS_LABELS[lead.status] }}</span>
              <div class="muted">попыток: {{ lead.attempts }}</div>
              <div v-if="lead.errorText" class="muted lead-table__error">{{ lead.errorText }}</div>
            </td>
            <td>
              <NuxtLink :to="`/admin/leads/${lead.id}`" class="button button--ghost button--small">Открыть</NuxtLink>
            </td>
          </tr>
          <tr v-if="leads.length === 0">
            <td colspan="6" class="muted">Заявок по этим фильтрам нет.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span>Страница {{ page }} из {{ pages }} · найдено {{ total }}</span>
      <div class="pagination__buttons">
        <button type="button" class="button button--ghost button--small" :disabled="page <= 1 || pending" @click="goPage(page - 1)">
          Назад
        </button>
        <button type="button" class="button button--ghost button--small" :disabled="page >= pages || pending" @click="goPage(page + 1)">
          Вперёд
        </button>
      </div>
    </div>
  </div>
</template>
