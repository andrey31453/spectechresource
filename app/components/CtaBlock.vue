<script setup lang="ts">
/**
 * Синяя CTA-полоса: заголовок, телефон и переход в контакты.
 * `bleed` — полоса во всю ширину экрана (страницы с полноэкранными секциями),
 * иначе — скруглённая плашка внутри контейнера страницы.
 *
 * Слот `form` заменяет кнопки справа формой заявки; телефон и мессенджеры
 * остаются в текстовой колонке.
 */
const props = withDefaults(
  defineProps<{
    phone: string;
    title?: string;
    text?: string;
    kicker?: string;
    /** Мелкая сноска под полосой (например, дисклеймер о ценах). */
    note?: string;
    bleed?: boolean;
    telegram?: string | null;
    whatsapp?: string | null;
    maxMessenger?: string | null;
  }>(),
  {
    title: "Нужна техника под задачу?",
    text: "Позвоните — подберём машину, посчитаем смену и сроки подачи.",
    kicker: "Свяжитесь с нами",
    note: "",
    bleed: false,
    telegram: null,
    whatsapp: null,
    maxMessenger: null,
  },
);

const messengers = computed(() =>
  [
    { label: "Telegram", href: props.telegram },
    { label: "WhatsApp", href: props.whatsapp },
    { label: "MAX", href: props.maxMessenger },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href)),
);
</script>

<template>
  <section
    class="relative isolate overflow-hidden bg-brand-dark"
    :class="bleed ? '' : 'mt-10 rounded-card'"
  >
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-linear-to-br from-brand/90 via-brand to-brand-dark"
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 [background-image:var(--site-grid-brand)] [background-size:56px_56px]"
    />

    <div
      class="relative mx-auto max-w-site px-5 md:px-8"
      :class="bleed ? 'py-14 md:py-[84px]' : 'py-10'"
    >
      <div
        class="grid gap-8 lg:grid-cols-[1.15fr_1fr]"
        :class="$slots.form ? 'lg:items-start' : 'lg:items-center'"
      >
        <div>
          <span
            class="inline-flex items-center gap-3 font-mono text-[11px] font-semibold tracking-[0.22em] text-white/80 uppercase"
          >
            <span aria-hidden="true" class="h-0.5 w-6 bg-white/70" />
            {{ kicker }}
          </span>
          <h2
            class="mt-4 text-[clamp(1.6rem,3vw,2.35rem)] leading-tight font-bold tracking-tight text-white"
          >
            {{ title }}
          </h2>
          <p v-if="text" class="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            {{ text }}
          </p>

          <div v-if="$slots.form" class="mt-6 flex flex-wrap items-center gap-3">
            <SiteButton :href="telHref(phone)" variant="ghost" tone="on-brand">
              <SiteIcon name="phone" class="h-4 w-4" />
              {{ phone }}
            </SiteButton>
            <a
              v-for="item in messengers"
              :key="item.label"
              :href="item.href"
              rel="noopener"
              class="inline-flex min-h-10 items-center rounded-field border border-white/40 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 hover:no-underline"
            >
              {{ item.label }}
            </a>
          </div>
        </div>

        <div v-if="$slots.form" class="w-full lg:justify-self-end lg:max-w-md">
          <slot name="form" />
        </div>
        <div v-else class="flex flex-wrap gap-3 lg:justify-end">
          <SiteButton :href="telHref(phone)" variant="primary" tone="on-brand">
            <SiteIcon name="phone" class="h-4 w-4" />
            {{ phone }}
          </SiteButton>
          <SiteButton to="/kontakty" variant="ghost" tone="on-brand" with-arrow>
            Оставить заявку
          </SiteButton>
        </div>
      </div>

      <p v-if="note" class="mt-10 border-t border-white/25 pt-4 text-xs leading-relaxed text-white/70">
        {{ note }}
      </p>
    </div>
  </section>
</template>
