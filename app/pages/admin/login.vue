<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminFieldError, AdminUserDto } from "~/types/admin";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Вход в админку",
  robots: "noindex, nofollow",
});

const route = useRoute();
const email = ref("");
const password = ref("");
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

/** Куда вернуть после входа: только внутренние админ-адреса, без открытого редиректа. */
const nextTarget = computed(() => {
  const raw = Array.isArray(route.query.next) ? route.query.next[0] : route.query.next;
  return typeof raw === "string" && raw.startsWith("/admin") ? raw : "/admin";
});

async function submit() {
  if (pending.value) return;

  pending.value = true;
  fieldErrors.value = {};
  formError.value = null;

  try {
    await $fetch<{ user: AdminUserDto }>("/api/admin/login", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    await navigateTo(nextTarget.value);
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string; data?: { errors?: AdminFieldError[] } }>;

    if (fetchError.statusCode === 400) {
      for (const issue of fetchError.data?.data?.errors ?? []) {
        fieldErrors.value[issue.field] = issue.message;
      }
      if (Object.keys(fieldErrors.value).length === 0) {
        formError.value = "Проверьте поля формы";
      }
    } else if (fetchError.statusCode === 401) {
      formError.value = "Неверный e-mail или пароль";
    } else if (fetchError.statusCode === 429) {
      formError.value = fetchError.data?.message ?? "Слишком много попыток входа. Подождите несколько минут.";
    } else {
      formError.value = "Не удалось войти. Попробуйте ещё раз чуть позже.";
    }
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="admin-auth">
    <h1 class="admin-auth__title">Вход в админку</h1>
    <p class="admin-auth__lead">Доступ только для сотрудников «Спецтехресурса».</p>

    <form class="admin-form" novalidate @submit.prevent="submit">
      <label class="field">
        <span class="field__label">E-mail</span>
        <input
          v-model="email"
          class="field__input"
          type="email"
          name="email"
          autocomplete="username"
          required
          :aria-invalid="Boolean(fieldErrors.email)"
        >
        <span v-if="fieldErrors.email" class="field__error">{{ fieldErrors.email }}</span>
      </label>

      <label class="field">
        <span class="field__label">Пароль</span>
        <input
          v-model="password"
          class="field__input"
          type="password"
          name="password"
          autocomplete="current-password"
          required
          :aria-invalid="Boolean(fieldErrors.password)"
        >
        <span v-if="fieldErrors.password" class="field__error">{{ fieldErrors.password }}</span>
      </label>

      <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>

      <button type="submit" class="button" :disabled="pending">
        {{ pending ? "Проверяем…" : "Войти" }}
      </button>
    </form>
  </div>
</template>
