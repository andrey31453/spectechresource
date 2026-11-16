<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminCityDto, AdminSiteSettingsDto } from "~/types/admin-settings";
import {
  cityFormBody,
  cityFormFrom,
  emptyCityForm,
  emptySettingsForm,
  settingsFormBody,
  settingsFormFrom,
  type CityForm,
  type SettingsForm,
} from "~/utils/admin-settings-forms";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Настройки · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData("admin-settings", () =>
  requestFetch<{ settings: AdminSiteSettingsDto; cities: AdminCityDto[] }>("/api/admin/settings"),
);
throwIfError(error.value);

const cities = computed(() => data.value?.cities ?? []);

const settingsForm = ref<SettingsForm>(emptySettingsForm());

if (data.value?.settings) {
  settingsForm.value = settingsFormFrom(data.value.settings);
}

const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const {
  fieldErrors: settingsErrors,
  formError: settingsError,
  pending: settingsPending,
  submit: submitSettings,
} = useAdminForm();

const {
  fieldErrors: cityErrors,
  formError: cityError,
  pending: cityPending,
  submit: submitCity,
} = useAdminForm();

async function saveSettings() {
  const result = await submitSettings(() =>
    $fetch<{ settings: AdminSiteSettingsDto }>("/api/admin/settings", {
      method: "PATCH",
      body: settingsFormBody(settingsForm.value),
    }),
  );

  if (!result) return;

  settingsForm.value = settingsFormFrom(result.settings);
  notice.value = "Настройки сохранены";
  removeError.value = null;
}

const cityForm = ref<CityForm>(emptyCityForm());
const editingCityId = ref<string | null>(null);
const cityFormOpen = ref(false);

function openCityCreate() {
  cityForm.value = emptyCityForm();
  editingCityId.value = null;
  cityFormOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openCityEdit(city: AdminCityDto) {
  cityForm.value = cityFormFrom(city);
  editingCityId.value = city.id;
  cityFormOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function closeCityForm() {
  cityFormOpen.value = false;
  editingCityId.value = null;
}

async function saveCity() {
  const body = cityFormBody(cityForm.value);
  const isEdit = Boolean(editingCityId.value);

  const result = await submitCity(() =>
    isEdit
      ? $fetch(`/api/admin/cities/${editingCityId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/cities", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Город сохранён" : "Город добавлен";
  closeCityForm();
  await refresh();
}

async function removeCity(city: AdminCityDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить город «${city.name}»? Действие необратимо.`)) return;

  removeError.value = null;
  notice.value = null;

  try {
    await $fetch(`/api/admin/cities/${city.id}`, { method: "DELETE" });
    notice.value = "Город удалён";
    if (editingCityId.value === city.id) closeCityForm();
    await refresh();
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить город";
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <span>Настройки</span>
        </div>
        <h1 class="admin-page__title">Настройки сайта</h1>
        <p class="admin-page__lead">
          Контакты, адрес и реквизиты видны в шапке, подвале и на страницах сайта. Изменения применяются сразу,
          пересборка не нужна.
        </p>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <form class="admin-form" novalidate @submit.prevent="saveSettings">
      <fieldset class="admin-form__section">
        <legend class="admin-form__legend">Компания и контакты</legend>
        <div class="admin-form__grid">
          <AdminField label="Название компании" :error="settingsErrors.companyName">
            <input v-model="settingsForm.companyName" class="field__input" type="text" name="companyName">
          </AdminField>
          <AdminField
            label="Телефон"
            :error="settingsErrors.phone"
            hint="Как показывать на сайте: +7 (495) 000-00-00"
          >
            <input v-model="settingsForm.phone" class="field__input" type="tel" name="phone">
          </AdminField>
          <AdminField label="E-mail" :error="settingsErrors.email">
            <input v-model="settingsForm.email" class="field__input" type="email" name="email">
          </AdminField>
          <AdminField label="Telegram" :error="settingsErrors.telegram" hint="@ник или ссылка">
            <input v-model="settingsForm.telegram" class="field__input" type="text" name="telegram">
          </AdminField>
          <AdminField label="WhatsApp" :error="settingsErrors.whatsapp" hint="@ник или ссылка">
            <input v-model="settingsForm.whatsapp" class="field__input" type="text" name="whatsapp">
          </AdminField>
          <AdminField label="MAX" :error="settingsErrors.maxMessenger" hint="@ник или ссылка">
            <input v-model="settingsForm.maxMessenger" class="field__input" type="text" name="maxMessenger">
          </AdminField>
          <AdminField label="Часы работы" :error="settingsErrors.workingHours" hint="Например, Пн–Вс, 08:00–20:00">
            <input v-model="settingsForm.workingHours" class="field__input" type="text" name="workingHours">
          </AdminField>
        </div>
      </fieldset>

      <fieldset class="admin-form__section">
        <legend class="admin-form__legend">Адрес и карта</legend>
        <div class="admin-form__grid">
          <AdminField
            label="Город"
            :error="settingsErrors.cityId"
            hint="Город по умолчанию для заголовков и адресов лендингов"
          >
            <select v-model="settingsForm.cityId" class="field__input" name="cityId">
              <option value="" disabled>Выберите город</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">
                {{ city.name }} ({{ city.nameIn }})
              </option>
            </select>
          </AdminField>
          <AdminField label="Адрес" :error="settingsErrors.address">
            <input v-model="settingsForm.address" class="field__input" type="text" name="address">
          </AdminField>
          <AdminField label="Широта" :error="settingsErrors.mapLat" hint="Например, 55.7558">
            <input v-model="settingsForm.mapLat" class="field__input" type="text" inputmode="decimal" name="mapLat">
          </AdminField>
          <AdminField label="Долгота" :error="settingsErrors.mapLng" hint="Например, 37.6173">
            <input v-model="settingsForm.mapLng" class="field__input" type="text" inputmode="decimal" name="mapLng">
          </AdminField>
        </div>
      </fieldset>
      <fieldset class="admin-form__section">
        <legend class="admin-form__legend">Реквизиты</legend>
        <div class="admin-form__grid">
          <AdminField label="Юридическое название" :error="settingsErrors.legalName">
            <input v-model="settingsForm.legalName" class="field__input" type="text" name="legalName">
          </AdminField>
          <AdminField label="ИНН" :error="settingsErrors.inn" hint="10 или 12 цифр">
            <input v-model="settingsForm.inn" class="field__input" type="text" inputmode="numeric" name="inn">
          </AdminField>
          <AdminField label="ОГРН" :error="settingsErrors.ogrn" hint="13 или 15 цифр">
            <input v-model="settingsForm.ogrn" class="field__input" type="text" inputmode="numeric" name="ogrn">
          </AdminField>
          <AdminField label="Юридический адрес" :error="settingsErrors.legalAddress">
            <input v-model="settingsForm.legalAddress" class="field__input" type="text" name="legalAddress">
          </AdminField>
        </div>
        <AdminField
          label="Дисклеймер о ценах"
          :error="settingsErrors.priceDisclaimer"
          hint="Показывается рядом с ценами"
        >
          <textarea
            v-model="settingsForm.priceDisclaimer"
            class="field__input field__textarea"
            name="priceDisclaimer"
            rows="3"
          />
        </AdminField>
      </fieldset>

      <fieldset class="admin-form__section">
        <legend class="admin-form__legend">Аналитика</legend>
        <div class="admin-form__grid">
          <AdminField
            label="ID Яндекс.Метрики"
            :error="settingsErrors.metrikaId"
            hint="Только цифры. Пусто — счётчик не подключается"
          >
            <input
              v-model="settingsForm.metrikaId"
              class="field__input"
              type="text"
              inputmode="numeric"
              name="metrikaId"
            >
          </AdminField>
        </div>
      </fieldset>

      <p v-if="settingsError" class="admin-form__error" role="alert">{{ settingsError }}</p>

      <div class="admin-form__actions">
        <button type="submit" class="button" :disabled="settingsPending">
          {{ settingsPending ? "Сохраняем…" : "Сохранить настройки" }}
        </button>
      </div>
    </form>


    <section class="admin-subcard">
      <div class="admin-subcard__head">
        <div>
          <h2 class="admin-subcard__title">Города</h2>
          <p class="admin-form__note">Город по умолчанию подставляется в заголовки и адреса лендингов.</p>
        </div>
        <button type="button" class="button button--small" @click="openCityCreate">+ Город</button>
      </div>

      <form v-if="cityFormOpen" class="admin-form" novalidate @submit.prevent="saveCity">
        <div class="admin-form__grid">
          <AdminField label="Название" :error="cityErrors.name">
            <input v-model="cityForm.name" class="field__input" type="text" name="cityName">
          </AdminField>
          <AdminField label="В предложном падеже" :error="cityErrors.nameIn" hint="«в Москве» — для заголовков">
            <input v-model="cityForm.nameIn" class="field__input" type="text" name="cityNameIn">
          </AdminField>
          <AdminField label="Код" :error="cityErrors.slug" hint="Латиница, например moskva">
            <input v-model="cityForm.slug" class="field__input" type="text" name="citySlug">
          </AdminField>
          <AdminField label="Порядок" :error="cityErrors.sortOrder" hint="Меньше — выше в списке">
            <input
              v-model.number="cityForm.sortOrder"
              class="field__input"
              type="number"
              min="0"
              name="citySortOrder"
            >
          </AdminField>
        </div>

        <div class="admin-form__grid admin-form__grid--half">
          <label class="field field--check">
            <input v-model="cityForm.isDefault" type="checkbox" name="cityIsDefault">
            <span class="field__label">Город по умолчанию</span>
          </label>
          <label class="field field--check">
            <input v-model="cityForm.isActive" type="checkbox" name="cityIsActive">
            <span class="field__label">Активен на сайте</span>
          </label>
        </div>

        <p v-if="cityError" class="admin-form__error" role="alert">{{ cityError }}</p>

        <div class="admin-form__actions">
          <button type="submit" class="button" :disabled="cityPending">
            {{ cityPending ? "Сохраняем…" : "Сохранить город" }}
          </button>
          <button type="button" class="button button--ghost" @click="closeCityForm">Отмена</button>
        </div>
      </form>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Город</th>
              <th>Код</th>
              <th>В предложном</th>
              <th>Порядок</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="city in cities" :key="city.id">
              <td><strong>{{ city.name }}</strong></td>
              <td><code>{{ city.slug }}</code></td>
              <td>{{ city.nameIn }}</td>
              <td>{{ city.sortOrder }}</td>
              <td>
                <span :class="['admin-badge', city.isActive ? 'admin-badge--on' : 'admin-badge--off']">
                  {{ city.isActive ? "активен" : "выключен" }}
                </span>
                <span v-if="city.isDefault" class="admin-badge">по умолчанию</span>
              </td>
              <td>
                <div class="table__actions">
                  <button type="button" class="button button--ghost button--small" @click="openCityEdit(city)">
                    Изменить
                  </button>
                  <button
                    type="button"
                    class="button button--ghost button--small button--danger"
                    @click="removeCity(city)"
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="cities.length === 0">
              <td colspan="6" class="muted">Городов пока нет.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

