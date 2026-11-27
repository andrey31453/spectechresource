<script setup lang="ts">
defineProps<{ html: string }>();
</script>

<template>
  <div class="min-w-0 max-w-3xl text-base leading-relaxed text-ink2 [overflow-wrap:anywhere] [&_h2]:mb-6 [&_h2]:mt-16 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mb-5 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-5 [&_li]:pl-1 [&_li::marker]:text-ember-ink [&_strong]:font-semibold [&_strong]:text-ink [&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-ember-ink [&_blockquote]:bg-white [&_blockquote]:p-6" v-html="html" />
</template>