<script setup lang="ts">
import type { AdminSpecDto } from "~/types/admin-catalog";

/** Редактор характеристик модели: строки «название → значение», порядок важен для таблицы на сайте. */
const specs = defineModel<AdminSpecDto[]>({ required: true });

function addRow() {
  specs.value = [...specs.value, { name: "", value: "" }];
}

function removeRow(index: number) {
  specs.value = specs.value.filter((_, rowIndex) => rowIndex !== index);
}

function move(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= specs.value.length) return;

  const next = [...specs.value];
  const [row] = next.splice(index, 1);
  next.splice(target, 0, row);
  specs.value = next;
}
</script>

<template>
  <div class="admin-specs">
    <div v-for="(spec, index) in specs" :key="index" class="admin-specs__row">
      <input
        v-model="spec.name"
        class="field__input"
        type="text"
        placeholder="Масса, т"
        aria-label="Название характеристики"
      >
      <input
        v-model="spec.value"
        class="field__input"
        type="text"
        placeholder="7,2"
        aria-label="Значение характеристики"
      >
      <button
        type="button"
        class="button button--ghost button--small"
        title="Выше"
        :disabled="index === 0"
        @click="move(index, -1)"
      >
        ↑
      </button>
      <button
        type="button"
        class="button button--ghost button--small"
        title="Ниже"
        :disabled="index === specs.length - 1"
        @click="move(index, 1)"
      >
        ↓
      </button>
      <button type="button" class="button button--ghost button--small" @click="removeRow(index)">Удалить</button>
    </div>

    <button type="button" class="button button--ghost button--small" @click="addRow">+ Характеристика</button>
  </div>
</template>
