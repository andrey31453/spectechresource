<script setup lang="ts">
/**
 * Акцентная CTA-полоса: заголовок, телефон и переход в контакты.
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
    equipmentTypeSlug?: string;
    equipmentLabel?: string;
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
    equipmentTypeSlug: undefined,
    equipmentLabel: undefined,
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
    class="relative isolate overflow-hidden bg-flame"
    :class="bleed ? '' : 'mt-10 rounded-card'"
  >
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-flame"
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
            class="inline-flex items-center gap-3 font-mono text-[11px] font-semibold tracking-[0.22em] text-ink uppercase"
          >
            <span aria-hidden="true" class="h-0.5 w-6 bg-ink" />
            {{ kicker }}
          </span>
          <h2
            class="mt-4 text-[clamp(1.6rem,3vw,2.35rem)] leading-tight font-bold tracking-tight text-ink"
          >
            {{ title }}
          </h2>
          <p v-if="text" class="mt-4 max-w-2xl text-sm leading-relaxed text-ink sm:text-base">
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
              class="inline-flex min-h-10 items-center rounded-field border border-ink/40 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink hover:no-underline"
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
          <SiteButton href="#zayavka" :data-equipment-type-slug="equipmentTypeSlug" :data-equipment-label="equipmentLabel" variant="ghost" tone="on-brand" with-arrow>
            Оставить заявку
          </SiteButton>
        </div>
      </div>

      <p v-if="note" class="mt-10 border-t border-ink/25 pt-4 text-xs leading-relaxed text-ink">
        {{ note }}
      </p>
    </div>
  </section>
</template>
