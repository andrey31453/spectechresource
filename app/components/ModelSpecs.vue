<script setup lang="ts">
defineProps<{ specs: Array<{ name: string; value: string }> }>();
</script>

<template>
  <dl v-if="specs.length" class="grid w-full grid-cols-1 gap-4">
    <div v-for="(spec, index) in specs" :key="index" class="flex min-w-0 items-baseline justify-between gap-5">
      <dt class="text-sm [overflow-wrap:anywhere]">{{ spec.name }}</dt>
      <dd class="m-0 max-w-1/2 text-right font-bold [overflow-wrap:anywhere]">{{ spec.value }}</dd>
    </div>
  </dl>
</template>