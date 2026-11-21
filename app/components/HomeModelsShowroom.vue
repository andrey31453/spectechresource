<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";

/**
 * Вариант B — «Шоурум».
 *
 * Вёрстка галереи: много воздуха, сдержанная песочная подложка, огромный номер
 * надгруппы призраком за заголовком, крупная типографика и лид в две колонки.
 * Карточка стоит на «подиуме»: белая плита с мягкой тенью, фото обрезано по краю
 * рамки, подпись отделена тонкой линией. При наведении карточка поднимается,
 * фото чуть смещается в кадре, а плашка «/ смена» выпрямляется — ракурс подписи
 * меняется без прыжков раскладки. Между полками — наклонная линия-разделитель.
 *
 * Данные и ленты — те же, что у остальных версий (`useModelRail`).
 */
defineProps<{
  sections: HomeModelSection[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const rails = useModelRail();
</script>

<template>
  <div class="mvb">
    <section
      v-for="section in sections"
      :id="`modeli-b-${section.slug}`"
      :key="section.slug"
      class="relative overflow-hidden px-5 py-14 md:px-8 lg:py-20"
    >
      <span class="mvb__ghost" aria-hidden="true">{{ section.number }}</span>

      <div class="relative mx-auto max-w-site">
        <span class="mvb__kicker">{{ section.numberLabel }} · каталог моделей</span>

        <h2 class="mvb__title">{{ section.title }}</h2>

        <div class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-10">
          <p class="mvb__lead">{{ section.lead }}</p>

          <dl class="mvb__facts">
            <div>
              <dt>Моделей</dt>
              <dd>{{ section.modelsLabel }}</dd>
            </div>
            <div>
              <dt>Разделов</dt>
              <dd>{{ section.shelvesLabel }}</dd>
            </div>
            <div>
              <dt>Смена</dt>
              <dd>{{ section.priceRange }}</dd>
            </div>
          </dl>
        </div>

        <ul class="mvb__tags">
          <li v-for="tag in section.tags" :key="tag">{{ tag }}</li>
        </ul>

        <div
          v-for="(shelf, shelfIndex) in section.shelves"
          :key="shelf.category.slug"
          class="relative"
          :class="shelfIndex === 0 ? 'mt-12' : 'mt-14'"
        >
          <!-- Наклонная линия между полками: разделяет, но не режет по линейке. -->
          <span v-if="shelfIndex > 0" class="mvb__slant" aria-hidden="true" />

          <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div class="min-w-0">
              <span class="mvb__shelf-num">{{ shelf.numberLabel }}</span>
              <h3 class="mvb__shelf-title">
                <NuxtLink :to="categoryPath(shelf.category.slug)">{{
                  shelf.category.title
                }}</NuxtLink>
              </h3>
              <p class="mvb__shelf-meta">{{ shelf.modelsLabel }} · {{ shelf.priceRange }}</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="mvb__arrow"
                :disabled="rails.railPageOf(shelf.category.slug) === 0"
                :aria-label="`Предыдущие модели раздела «${shelf.category.title}»`"
                @click="rails.scrollRail(shelf.category.slug, -1)"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" />
                </svg>
              </button>
              <button
                type="button"
                class="mvb__arrow"
                :disabled="
                  rails.railPageOf(shelf.category.slug) >= rails.railPagesOf(shelf.category.slug) - 1
                "
                :aria-label="`Следующие модели раздела «${shelf.category.title}»`"
                @click="rails.scrollRail(shelf.category.slug, 1)"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
                </svg>
              </button>
            </div>
          </div>

          <ul
            :ref="(el) => rails.setRail(shelf.category.slug, el)"
            class="mvb__rail mt-6 flex gap-5 overflow-x-auto pb-2"
            :aria-label="`Модели раздела «${shelf.category.title}»`"
            @scroll.passive="rails.update(shelf.category.slug)"
          >
            <li
              v-for="(item, modelIndex) in shelf.models"
              :key="item.id"
              class="w-[80vw] shrink-0 sm:w-[320px] xl:w-[368px]"
            >
              <NuxtLink
                :to="typePath(item.typeSlug, citySlug)"
                class="mvb-card group flex h-full flex-col"
              >
                <div class="mvb-card__frame relative overflow-hidden">
                  <div class="aspect-4/3 overflow-hidden">
                    <img
                      v-if="item.photo"
                      class="mvb-card__photo h-full w-full object-cover"
                      :src="item.photo"
                      :alt="`${item.brand} ${item.model} — ${item.typeName}`"
                      width="736"
                      height="552"
                      loading="lazy"
                      decoding="async"
                    >
                    <span v-else class="mvb-card__empty">фото готовится</span>
                  </div>
                  <span class="mvb-card__no" aria-hidden="true">{{
                    String(modelIndex + 1).padStart(2, "0")
                  }}</span>
                  <span class="mvb-card__hover" aria-hidden="true">Забронировать смену →</span>
                </div>

                <div class="mvb-card__caption">
                  <span class="mvb-card__brand">{{ item.brand }}</span>
                  <h4 class="mvb-card__name">{{ item.model }}</h4>
                  <p class="mvb-card__type">{{ item.typeName }}</p>

                  <div class="mvb-card__price-row">
                    <b class="mvb-card__price">{{ formatPrice(item.pricePerShift) }}</b>
                    <span class="mvb-card__badge">/ смена</span>
                  </div>
                  <span class="sr-only">— открыть карточку вида</span>
                </div>
              </NuxtLink>
            </li>
          </ul>

          <div
            v-if="rails.railPagesOf(shelf.category.slug) > 1"
            class="mvb__dots"
            role="tablist"
            :aria-label="`Страницы раздела «${shelf.category.title}»`"
          >
            <button
              v-for="page in rails.railPagesOf(shelf.category.slug)"
              :key="page"
              type="button"
              role="tab"
              class="mvb__dot"
              :aria-label="`Страница ${page} из ${rails.railPagesOf(shelf.category.slug)}`"
              :aria-selected="page - 1 === rails.railPageOf(shelf.category.slug)"
              @click="rails.goToPage(shelf.category.slug, page - 1)"
            >
              <span
                class="mvb__dot-mark"
                :class="{ 'mvb__dot-mark--on': page - 1 === rails.railPageOf(shelf.category.slug) }"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <a class="mvb__all" href="/katalog">Смотреть весь каталог →</a>
      </div>
    </section>

    <p
      class="mx-auto max-w-site px-5 pb-12 text-[13px] leading-6 text-[#5a6469] md:px-8"
    >
      {{ priceDisclaimer }}
    </p>
  </div>
</template>

<style scoped>
/*
 * Песочная подложка шоурума: тёплый свет сверху справа, как от витринного софита.
 * Версия светлая намеренно — рядом с графитовым «чертежом» она читается как зал,
 * а не как ещё один тёмный блок.
 */
.mvb {
  background-color: #f5f4ef;
  background-image:
    radial-gradient(1100px 520px at 92% -8%, rgb(255 122 47 / 0.1), transparent 62%),
    radial-gradient(760px 420px at 4% 102%, rgb(13 18 20 / 0.05), transparent 60%);
}

/* Призрачный номер надгруппы: держит ритм, но не спорит с заголовком. */
.mvb__ghost {
  display: none;
  position: absolute;
  top: 2.5rem;
  right: 2rem;
  font-family: var(--font-mono);
  font-size: clamp(5rem, 13vw, 11rem);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: rgb(13 18 20 / 0.06);
  pointer-events: none;
}

@media (min-width: 768px) {
  .mvb__ghost {
    display: block;
  }
}

.mvb__kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #b83c12;
}

.mvb__kicker::before {
  content: "";
  width: 26px;
  height: 2px;
  background-color: #b83c12;
}

.mvb__title {
  margin-top: 0.85rem;
  max-width: 18ch;
  font-size: clamp(2rem, 5.6vw, 4rem);
  line-height: 0.98;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #0d1214;
}

.mvb__lead {
  max-width: 46ch;
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.65;
  color: #3d474b;
}

/* Три цифры группы: тонкие линии вместо плашек — как на витринной этикетке. */
.mvb__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid #c9c4b6;
  border-bottom: 1px solid #c9c4b6;
}

.mvb__facts > div {
  padding: 0.75rem 0.75rem 0.75rem 0;
}

.mvb__facts > div + div {
  border-left: 1px solid #d8d2c0;
  padding-left: 0.75rem;
}

.mvb__facts dt {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5a6469;
}

.mvb__facts dd {
  margin-top: 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0d1214;
}

.mvb__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 1.25rem;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #3d474b;
}

.mvb__tags li + li::before {
  content: "/";
  margin-right: 1rem;
  color: #b8b1a0;
}

/* Наклонный разделитель полок: графитовая линия с оранжевым началом. */
.mvb__slant {
  display: block;
  height: 1px;
  margin-bottom: 1.5rem;
  background-image: linear-gradient(to right, #b83c12 0 56px, #c9c4b6 56px 100%);
  transform: rotate(-1.1deg);
  transform-origin: left center;
}

.mvb__shelf-num {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #b83c12;
}

.mvb__shelf-title {
  margin-top: 0.4rem;
  font-size: clamp(1.25rem, 2.4vw, 1.7rem);
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0d1214;
}

.mvb__shelf-title a {
  display: inline-block;
  padding-block: 2px;
  transition: color 0.18s ease-out;
}

.mvb__shelf-title a:hover {
  color: #b83c12;
}

.mvb__shelf-meta {
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5a6469;
}

.mvb__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #c9c4b6;
  border-radius: 9999px;
  background-color: #ffffff;
  color: #0d1214;
  transition:
    border-color 0.18s ease-out,
    background-color 0.18s ease-out,
    color 0.18s ease-out;
}

.mvb__arrow:hover:not(:disabled) {
  border-color: #0d1214;
  background-color: #0d1214;
  color: #ffffff;
}

.mvb__arrow:disabled {
  cursor: default;
  opacity: 0.35;
}

.mvb__dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

/* Точка в кнопке 44×44: палец попадает, а рисунок остаётся аккуратным. */
.mvb__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
}

.mvb__dot-mark {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background-color: #c9c4b6;
  transition:
    width 0.2s ease-out,
    background-color 0.2s ease-out;
}

.mvb__dot-mark--on {
  width: 22px;
  background-color: #b83c12;
}

.mvb__all {
  display: inline-flex;
  margin-top: 2.5rem;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0d1214;
  border-bottom: 1px solid #0d1214;
  padding-block: 3px 4px;
  transition:
    color 0.18s ease-out,
    border-color 0.18s ease-out;
}

.mvb__all:hover {
  color: #b83c12;
  border-color: #b83c12;
}

/* `position: relative` — свой containing block для абсолютных потомков карточки
   (`sr-only`), иначе они уезжают мимо clip ленты и растягивают документ. */
.mvb__rail {
  position: relative;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.mvb__rail::-webkit-scrollbar {
  display: none;
}

.mvb__rail > li {
  scroll-snap-align: start;
}

/* Карточка на подиуме: белая плита, тень-подставка, тонкая линия под фото. */
.mvb-card {
  border: 1px solid #e2ddcd;
  background-color: #ffffff;
  box-shadow: 0 16px 30px -26px rgb(13 18 20 / 0.55);
  transition:
    transform 0.28s ease-out,
    box-shadow 0.28s ease-out,
    border-color 0.28s ease-out;
}

.mvb-card:hover,
.mvb-card:focus-visible {
  transform: translateY(-6px);
  border-color: #c9c4b6;
  box-shadow:
    0 30px 46px -28px rgb(13 18 20 / 0.5),
    0 10px 18px -14px rgb(13 18 20 / 0.35);
}

/* Фото выходит за рамку кадра на 4% с каждой стороны — край обрезан, кадр плотнее. */
.mvb-card__photo {
  width: 108%;
  height: 108%;
  margin: -4% 0 0 -4%;
  transition: transform 0.6s ease-out;
}

.mvb-card:hover .mvb-card__photo,
.mvb-card:focus-visible .mvb-card__photo {
  transform: scale(1.02) translate(1%, 1%);
}

.mvb-card__empty {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #5a6469;
}

.mvb-card__no {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.15rem 0.4rem;
  background-color: rgb(249 248 244 / 0.92);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #0d1214;
}

/* Призыв поверх фото: появляется только при наведении и с клавиатуры. */
.mvb-card__hover {
  position: absolute;
  inset-inline: 0.75rem;
  bottom: 0.75rem;
  padding: 0.4rem 0.6rem;
  background-color: #0d1214;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ffffff;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.22s ease-out,
    transform 0.22s ease-out;
}

.mvb-card:hover .mvb-card__hover,
.mvb-card:focus-visible .mvb-card__hover {
  opacity: 1;
  transform: translateY(0);
}

.mvb-card__caption {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 0.9rem 1rem 1rem;
  border-top: 1px solid #e2ddcd;
}

.mvb-card__brand {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #b83c12;
}

.mvb-card__name {
  margin-top: 0.3rem;
  font-size: 1.22rem;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0d1214;
}

.mvb-card__type {
  margin-top: 0.2rem;
  font-size: 0.86rem;
  line-height: 1.4;
  color: #5a6469;
}

.mvb-card__price-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.9rem;
}

.mvb-card__price {
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0d1214;
}

/*
 * «Ракурс подписи»: плашка стоит под углом, при наведении выпрямляется
 * и чуть увеличивается — заметное движение без сдвига строки цены.
 */
.mvb-card__badge {
  padding: 0.1rem 0.35rem;
  background-color: #f2d8c6;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8c3411;
  transform: rotate(-2.5deg);
  transition:
    transform 0.24s ease-out,
    background-color 0.24s ease-out;
}

.mvb-card:hover .mvb-card__badge,
.mvb-card:focus-visible .mvb-card__badge {
  transform: rotate(0) scale(1.04);
  background-color: #ff7a2f;
  color: #14100a;
}

@media (prefers-reduced-motion: reduce) {
  .mvb-card,
  .mvb-card:hover,
  .mvb-card:focus-visible {
    transform: none;
    transition: none;
  }

  .mvb-card__photo,
  .mvb-card__hover,
  .mvb-card__badge,
  .mvb__arrow,
  .mvb__dot-mark,
  .mvb__all {
    transition: none;
  }

  .mvb-card__hover {
    opacity: 1;
    transform: none;
  }
}
</style>

