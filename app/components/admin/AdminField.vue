<script setup lang="ts">
/** Поле формы админки: подпись, слот ввода, подсказка и ошибка — одинаково на всех экранах. */
defineProps<{
  label: string;
  error?: string;
  hint?: string;
}>();
</script>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <slot />
    <span v-if="hint" class="field__hint">{{ hint }}</span>
    <span v-if="error" class="field__error">{{ error }}</span>
  </label>
</template>
