<script setup lang="ts">
import { NuxtLink } from "#components";

/**
 * Кнопка публичных страниц. Внутренние адреса — через NuxtLink (`to`),
 * внешние и `tel:` — обычной ссылкой (`href`), без адреса — `<button>`
 * (например, отправка формы).
 *
 * variant: `primary` — синий градиент, `ghost` — рамка.
 * tone: `light` — на тёмном фоне, `dark` — на светлом, `on-brand` — на синей полосе.
 */
type Variant = "primary" | "ghost";
type Tone = "light" | "dark" | "on-brand";

const props = withDefaults(
  defineProps<{
    to?: string;
    href?: string;
    variant?: Variant;
    tone?: Tone;
    size?: "md" | "sm";
    withArrow?: boolean;
    type?: "button" | "submit";
  }>(),
  {
    to: undefined,
    href: undefined,
    variant: "primary",
    tone: "dark",
    size: "md",
    withArrow: false,
    type: "button",
  },
);

const base =
  "inline-flex items-center justify-center gap-2 rounded-field font-semibold whitespace-nowrap transition-colors hover:no-underline disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, Record<Tone, string>> = {
  primary: {
    light:
      "bg-linear-to-br from-brand-bright via-brand to-brand-dark text-white shadow-[0_14px_32px_-16px_rgb(15_92_156/0.85)] hover:brightness-110",
    dark: "bg-linear-to-br from-brand-bright via-brand to-brand-dark text-white shadow-[0_14px_32px_-16px_rgb(15_92_156/0.85)] hover:brightness-110",
    "on-brand": "bg-white text-brand-dark hover:bg-brand-soft",
  },
  ghost: {
    light: "border border-white/30 text-snow hover:border-brand-light hover:text-brand-light",
    dark: "border border-line text-ink hover:border-brand hover:text-brand",
    "on-brand": "border border-white/50 text-white hover:bg-white/10",
  },
};

const sizes = {
  md: "min-h-12 px-6 text-sm",
  sm: "min-h-10 px-4 text-xs",
};

const classes = computed(() => [base, variants[props.variant][props.tone], sizes[props.size]]);

/** Без `to` и `href` кнопка работает как `<button>` — например, `type="submit"` в форме. */
const tag = computed(() => {
  if (props.href) return "a";
  if (props.to) return NuxtLink;
  return "button";
});
</script>

<template>
  <component
    :is="tag"
    :href="props.href"
    :to="props.href ? undefined : props.to"
    :type="tag === 'button' ? props.type : undefined"
    :class="classes"
  >
    <slot />
    <SiteIcon v-if="withArrow" name="arrow" class="h-4 w-4" />
  </component>
</template>
