<script setup lang="ts">
import type { HomeModelDto } from "~/types/catalog";

/**
 * Карточка модели на главной — главный «товарный» элемент страницы.
 *
 * Вертикальная: фото на всю ширину, крупные название и цена, три характеристики.
 * При наведении и с клавиатуры карточка не просто увеличивается: она меняет
 * палитру, получает рамку и полосу в цвет тона секции, цену ярким акцентом
 * и призыв «Забронировать смену» вместо подписи под ценой, а на фото выезжает
 * полный список характеристик. Белая карточка стоит на песочной, оранжевой
 * и чёрной полосе, поэтому состояние наведения приходит из секции переменными
 * `--card-hover-*` (`HOME_MODEL_TONE_STYLES`).
 * Место под `scale` зарезервировано отступом `li` в `index.vue`, поэтому соседние
 * карточки не двигаются. Вся карточка — ссылка на посадочную вида: отдельных
 * страниц моделей в каталоге нет.
 */
const props = defineProps<{
  model: HomeModelDto;
  citySlug: string;
}>();

/** Сколько характеристик видно всегда; остальные — в панели на фото. */
const VISIBLE_SPECS = 3;

const href = computed(() => typePath(props.model.typeSlug, props.citySlug));
const visibleSpecs = computed(() => props.model.specs.slice(0, VISIBLE_SPECS));
/** Вторая строка под ценой смены: «4 000 ₽/час», если цена за час заполнена. */
const hourPrice = computed(() =>
  props.model.pricePerHour ? formatPrice(props.model.pricePerHour) : null,
);
</script>

<template>
  <NuxtLink :to="href" class="model-card group relative flex h-full flex-col overflow-hidden rounded-[6px]">
    <!-- Акцентная полоса группы: растёт слева направо при наведении. -->
    <span class="model-card__bar" aria-hidden="true" />

    <div class="relative aspect-[16/10] w-full overflow-hidden bg-[#e8e5db]">
      <img
        v-if="model.photo"
        class="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110 group-hover:brightness-90 group-focus-visible:scale-110 group-focus-visible:brightness-90"
        :src="model.photo"
        :alt="`${model.brand} ${model.model} — ${model.typeName}`"
        width="760"
        height="475"
        loading="lazy"
        decoding="async"
      >
      <span
        v-else
        class="absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.14em] text-[#8a8474] uppercase"
        >фото готовится</span
      >

      <!-- Доп. информация при наведении: полный список характеристик поверх фото.
           Панель лежит в потоке карточки, но абсолютом — раскладку не меняет.
           `aria-hidden`: это визуальный дубль характеристик, скринридеру хватает текста. -->
      <div
        v-if="model.specs.length"
        aria-hidden="true"
        class="model-card__specs pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-4 pt-8 pb-3 text-white opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span class="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-70"
          >Характеристики</span
        >
        <dl class="mt-1.5 space-y-0.5 text-[12.5px] leading-5">
          <div
            v-for="spec in model.specs"
            :key="spec.name"
            class="flex items-baseline justify-between gap-3"
          >
            <dt class="min-w-0 opacity-70">{{ spec.name }}</dt>
            <dd class="shrink-0 font-medium">{{ spec.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <span class="model-card__brand">{{ model.brand }}</span>
      <h4 class="mt-1.5 text-[1.28rem] leading-tight font-semibold tracking-tight text-[var(--card-ink)]">
        {{ model.model }}
      </h4>
      <p class="mt-1 text-sm leading-5 text-[var(--card-muted)]">{{ model.typeName }}</p>

      <dl v-if="visibleSpecs.length" class="mt-3 space-y-1 text-[13px] leading-5">
        <div
          v-for="spec in visibleSpecs"
          :key="spec.name"
          class="flex items-baseline justify-between gap-3"
        >
          <dt class="min-w-0 text-[var(--card-muted)]">{{ spec.name }}</dt>
          <dd class="shrink-0 text-right font-medium text-[var(--card-ink)]">{{ spec.value }}</dd>
        </div>
      </dl>

      <div class="mt-auto pt-4">
        <div class="flex items-end justify-between gap-3 border-t border-[var(--card-line)] pt-3">
          <span class="min-w-0">
            <b
              class="block text-[1.5rem] leading-none font-bold tracking-tight text-[var(--card-price)]"
              >{{ formatPrice(model.pricePerShift) }}</b
            >
            <span class="relative mt-1.5 block h-4 text-xs leading-4">
              <span
                class="absolute inset-0 truncate text-[var(--card-muted)] transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0"
              >
                за смену 8 ч<template v-if="hourPrice"> · {{ hourPrice }}/час</template>
              </span>
              <span
                class="model-card__cta absolute inset-0 truncate font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                Забронировать смену →
              </span>
            </span>
          </span>
          <span aria-hidden="true" class="model-card__go">
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              focusable="false"
            >
              <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
            </svg>
          </span>
        </div>
      </div>

      <span class="sr-only">— открыть карточку вида</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
/*
 * Состояния карточки живут в CSS-переменных: при наведении и с клавиатуры меняется
 * не десяток классов, а палитра карточки, поэтому инверсия получается целиком
 * и без рассинхронизации цветов.
 * Белая карточка одинаково читается на песочной, оранжевой и чёрной полосе,
 * а состояние наведения задаёт тон секции (`HOME_MODEL_TONE_STYLES`): на светлой
 * и оранжевой полосе — графит, на чёрной — оранжевая заливка, иначе карточка
 * слилась бы с фоном. Значения ниже — тот же графит по умолчанию.
 */
.model-card {
  --card-bg: #ffffff;
  --card-ink: #0d1214;
  --card-muted: #3d474b;
  --card-line: #e7e1d1;
  --card-price: #0d1214;
  --card-brand: #b83c12;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border, #d8d2c0);
  box-shadow: 0 1px 2px rgb(13 18 20 / 0.06);
  transition:
    transform 0.22s ease-out,
    background-color 0.22s ease-out,
    border-color 0.22s ease-out,
    box-shadow 0.22s ease-out;
}

/*
 * `--card-hover-*` здесь только читаются: их ставит секция, и объявлять их локально
 * нельзя — собственное свойство перебило бы унаследованное от полосы.
 */
.model-card:hover,
.model-card:focus-visible {
  --card-bg: var(--card-hover-bg, #0d1214);
  --card-ink: var(--card-hover-ink, #ffffff);
  --card-muted: var(--card-hover-muted, rgb(255 255 255 / 0.72));
  --card-line: var(--card-hover-line, rgb(255 255 255 / 0.18));
  --card-border: var(--card-hover-border, #ff7a2f);
  --card-price: var(--card-hover-price, #ff7a2f);
  --card-brand: var(--card-hover-price, #ff7a2f);
  transform: scale(1.03);
  box-shadow:
    0 26px 44px -22px rgb(13 18 20 / 0.65),
    0 10px 20px -14px rgb(13 18 20 / 0.55);
  z-index: 10;
}

.model-card__bar {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 2;
  height: 3px;
  background-color: var(--card-hover-bar, #ff7a2f);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.28s ease-out;
}

.model-card:hover .model-card__bar,
.model-card:focus-visible .model-card__bar {
  transform: scaleX(1);
}

.model-card__brand {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--card-brand);
  transition: color 0.22s ease-out;
}

.model-card__specs {
  background-image: linear-gradient(
    to top,
    rgb(13 18 20 / 0.96),
    rgb(13 18 20 / 0.82) 55%,
    transparent
  );
}

/* Призыв вместо подписи под ценой: цвет задаёт тон секции. */
.model-card__cta {
  color: var(--card-hover-price, #ff7a2f);
}

.model-card__go {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--card-brand) 40%, #ffffff);
  color: var(--card-brand);
  transition:
    background-color 0.22s ease-out,
    border-color 0.22s ease-out,
    color 0.22s ease-out,
    transform 0.22s ease-out;
}

.model-card:hover .model-card__go,
.model-card:focus-visible .model-card__go {
  background-color: var(--card-hover-go-bg, #ff7a2f);
  border-color: var(--card-hover-go-bg, #ff7a2f);
  color: var(--card-hover-go-ink, #0d1214);
  transform: translateX(2px);
}

/*
 * Уменьшенная анимация: инверсия цвета остаётся (это состояние, а не движение),
 * а масштаб и полоса-растяжка выключаются.
 */
@media (prefers-reduced-motion: reduce) {
  .model-card,
  .model-card:hover,
  .model-card:focus-visible {
    transform: none;
    transition: none;
  }

  .model-card__bar,
  .model-card__go {
    transition: none;
  }
}
</style>
