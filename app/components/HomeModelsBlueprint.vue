<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";

/**
 * Вариант A — «Инженерный чертёж».
 *
 * Каталог как техническая документация: графитовый лист в миллиметровой сетке,
 * каждая надгруппа — «лист» с рамкой, угловыми метками и штампом (моделей,
 * разделов, цена смены). Полки подчёркнуты штриховой линией, номера и метаданные
 * набраны моно, между шапкой и лидом идёт размерная линия, на фото — выноска
 * с видом техники. Фотографии обесцвечены и получают цвет только при наведении:
 * в чертеже цвет — выделение, а не фон.
 *
 * Данные и ленты — те же, что у остальных версий: `sections` приходит с главной,
 * механика листания — `useModelRail`.
 */
defineProps<{
  sections: HomeModelSection[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const rails = useModelRail();
</script>

<template>
  <div class="mva">
    <section
      v-for="(section, sectionIndex) in sections"
      :id="`modeli-a-${section.slug}`"
      :key="section.slug"
      class="relative px-5 py-10 md:px-8 lg:py-14"
    >
      <div class="mx-auto max-w-site">
        <div class="mva-sheet relative border border-white/14 px-4 pt-5 pb-5 md:px-8 md:pt-7 md:pb-6">
          <!-- Угловые метки чертёжного листа. -->
          <span class="mva-corner mva-corner--tl" aria-hidden="true" />
          <span class="mva-corner mva-corner--tr" aria-hidden="true" />
          <span class="mva-corner mva-corner--bl" aria-hidden="true" />
          <span class="mva-corner mva-corner--br" aria-hidden="true" />

          <div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
            <div class="min-w-0">
              <span class="mva-kicker">
                <span class="mva-kicker__rule" aria-hidden="true" />
                Чертёж · лист {{ section.numberLabel }}
              </span>
              <h2
                class="mt-3 text-[clamp(1.55rem,3.5vw,2.55rem)] leading-[1.04] font-bold tracking-tight text-[#f4efe2] uppercase"
              >
                {{ section.title }}
              </h2>
            </div>

            <!-- Штамп: то, что на чертеже всегда стоит в правом нижнем углу. -->
            <dl class="mva-stamp">
              <div class="mva-stamp__row">
                <dt>Моделей</dt>
                <dd>{{ section.modelsLabel }}</dd>
              </div>
              <div class="mva-stamp__row">
                <dt>Разделов</dt>
                <dd>{{ section.shelvesLabel }}</dd>
              </div>
              <div class="mva-stamp__row">
                <dt>Смена</dt>
                <dd>{{ section.priceRange }}</dd>
              </div>
            </dl>
          </div>

          <!-- Размерная линия: декоративная, повторяет счётчики шапки. -->
          <div class="mva-dim mt-6" aria-hidden="true">
            <span class="mva-dim__line" />
            <span class="mva-dim__label">{{ section.numberLabel }} · {{ section.modelsLabel }}</span>
            <span class="mva-dim__line" />
          </div>

          <p class="mt-4 max-w-3xl text-[15px] leading-7 text-[#a9a49a]">{{ section.lead }}</p>

          <ul
            class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10px] tracking-[0.16em] text-[#ff9c4a] uppercase"
          >
            <li v-for="tag in section.tags" :key="tag">[ {{ tag }} ]</li>
          </ul>

          <div
            v-for="shelf in section.shelves"
            :key="shelf.category.slug"
            class="mt-8 border-t border-dashed border-white/20 pt-5"
          >
            <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <span class="font-mono text-[11px] tracking-[0.18em] text-[#ff9c4a]">{{
                  shelf.numberLabel
                }}</span>
                <h3 class="text-[1.15rem] leading-tight font-semibold">
                  <NuxtLink
                    :to="categoryPath(shelf.category.slug)"
                    class="text-[#f4efe2] transition hover:text-[#ff9c4a]"
                    >{{ shelf.category.title }}</NuxtLink
                  >
                </h3>
                <span
                  class="hidden font-mono text-[10px] tracking-[0.14em] text-[#a29c90] uppercase md:inline"
                  >{{ shelf.modelsLabel }} · {{ shelf.priceRange }}</span
                >
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="mva-arrow"
                  :disabled="rails.railPageOf(shelf.category.slug) === 0"
                  :aria-label="`Предыдущие модели раздела «${shelf.category.title}»`"
                  @click="rails.scrollRail(shelf.category.slug, -1)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
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
                  class="mva-arrow"
                  :disabled="
                    rails.railPageOf(shelf.category.slug) >=
                    rails.railPagesOf(shelf.category.slug) - 1
                  "
                  :aria-label="`Следующие модели раздела «${shelf.category.title}»`"
                  @click="rails.scrollRail(shelf.category.slug, 1)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
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
              class="mva-rail mt-3 flex gap-4 overflow-x-auto pb-1"
              :aria-label="`Модели раздела «${shelf.category.title}»`"
              @scroll.passive="rails.update(shelf.category.slug)"
            >
              <li
                v-for="(item, modelIndex) in shelf.models"
                :key="item.id"
                class="w-[80vw] shrink-0 sm:w-[300px] xl:w-[336px]"
              >
                <NuxtLink
                  :to="typePath(item.typeSlug, citySlug)"
                  class="mva-card group flex h-full flex-col"
                >
                  <div class="relative aspect-16/11 overflow-hidden border-b border-white/14">
                    <img
                      v-if="item.photo"
                      class="mva-card__photo h-full w-full object-cover"
                      :src="item.photo"
                      :alt="`${item.brand} ${item.model} — ${item.typeName}`"
                      width="672"
                      height="462"
                      loading="lazy"
                      decoding="async"
                    >
                    <span v-else class="mva-card__empty">фото готовится</span>
                    <span class="mva-card__index" aria-hidden="true">{{
                      String(modelIndex + 1).padStart(2, "0")
                    }}</span>
                    <span class="mva-card__callout" aria-hidden="true">{{ item.typeName }}</span>
                  </div>

                  <div class="flex flex-1 flex-col p-4">
                    <span class="mva-card__brand">{{ item.brand }}</span>
                    <h4 class="mt-1.5 text-[1.12rem] leading-tight font-semibold text-[#f4efe2]">
                      {{ item.model }}
                    </h4>

                    <dl v-if="item.specs.length" class="mt-3 space-y-1">
                      <div
                        v-for="spec in item.specs.slice(0, 3)"
                        :key="spec.name"
                        class="mva-card__spec"
                      >
                        <dt>{{ spec.name }}</dt>
                        <dd>{{ spec.value }}</dd>
                      </div>
                    </dl>

                    <div
                      class="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-white/20 pt-3"
                    >
                      <span class="min-w-0">
                        <b class="mva-card__price">{{ formatPrice(item.pricePerShift) }}</b>
                        <span class="mva-card__unit">смена 8 ч</span>
                      </span>
                      <span class="mva-card__go" aria-hidden="true">
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
                    <span class="sr-only">— открыть карточку вида</span>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <a
            v-if="sectionIndex === 0"
            class="mva-link mt-7 inline-flex items-center gap-2"
            href="/katalog"
            >Весь каталог
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <p
      class="mx-auto max-w-site px-5 pb-10 font-mono text-[11px] leading-5 tracking-[0.06em] text-[#a29c90] md:px-8"
    >
      {{ priceDisclaimer }}
    </p>
  </div>
</template>

<style scoped>
/*
 * Миллиметровка: шаг 24 px, каждые 120 px — усиленная линия. Сетка лежит на корне
 * версии, поэтому одна на все «листы» и не рвётся между секциями.
 */
.mva {
  background-color: #0a0e11;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px),
    linear-gradient(to right, rgb(255 255 255 / 0.085) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.085) 1px, transparent 1px);
  background-size:
    24px 24px,
    24px 24px,
    120px 120px,
    120px 120px;
}

.mva-sheet {
  background-color: rgb(10 14 17 / 0.72);
}

/* Уголки-«засечки» чертёжного листа. */
.mva-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: #ff9c4a;
  border-style: solid;
  border-width: 0;
}

.mva-corner--tl {
  top: -1px;
  left: -1px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.mva-corner--tr {
  top: -1px;
  right: -1px;
  border-top-width: 2px;
  border-right-width: 2px;
}

.mva-corner--bl {
  bottom: -1px;
  left: -1px;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.mva-corner--br {
  right: -1px;
  bottom: -1px;
  border-right-width: 2px;
  border-bottom-width: 2px;
}

.mva-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #ff9c4a;
}

.mva-kicker__rule {
  display: inline-block;
  width: 26px;
  height: 2px;
  background-color: #ff9c4a;
}

/* Штамп листа: три строки «ключ — значение», как в основной надписи чертежа. */
.mva-stamp {
  display: grid;
  min-width: 224px;
  border: 1px solid rgb(255 255 255 / 0.18);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.mva-stamp__row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 8px;
  padding: 5px 8px;
}

.mva-stamp__row + .mva-stamp__row {
  border-top: 1px solid rgb(255 255 255 / 0.14);
}

.mva-stamp dt {
  color: #a29c90;
}

.mva-stamp dd {
  color: #f4efe2;
  text-align: right;
}

/* Размерная линия: штрих с засечками на концах. */
.mva-dim {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mva-dim__line {
  position: relative;
  flex: 1;
  height: 8px;
  border-top: 1px dashed #cf4418;
}

.mva-dim__line::before,
.mva-dim__line::after {
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
  height: 8px;
  background-color: #cf4418;
}

.mva-dim__line::before {
  left: 0;
}

.mva-dim__line::after {
  right: 0;
}

.mva-dim__label {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ff9c4a;
}

/*
 * `position: relative` обязателен: карточка внутри содержит `sr-only`-подпись
 * (`position: absolute`), и без своего containing block она находит `.mva-sheet`,
 * то есть уезжает мимо clip ленты и растягивает документ по горизонтали.
 * С относительной лентой абсолютные потомки обрезаются её `overflow`.
 */
/* Ссылки в заголовках полок — минимум 24 px по высоте (WCAG 2.5.8). */
.mva h3 a {
  display: inline-block;
  padding-block: 2px;
}

.mva-rail {
  position: relative;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.mva-rail::-webkit-scrollbar {
  display: none;
}

.mva-rail > li {
  scroll-snap-align: start;
}

.mva-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 0.24);
  color: #f4efe2;
  background-color: rgb(255 255 255 / 0.04);
  transition:
    border-color 0.18s ease-out,
    color 0.18s ease-out,
    background-color 0.18s ease-out;
}

.mva-arrow:hover:not(:disabled) {
  border-color: #ff7a2f;
  background-color: #ff7a2f;
  color: #14100a;
}

.mva-arrow:disabled {
  cursor: default;
  opacity: 0.3;
}

.mva-card {
  border: 1px solid rgb(255 255 255 / 0.16);
  background-color: rgb(13 18 20 / 0.9);
  transition:
    border-color 0.2s ease-out,
    background-color 0.2s ease-out,
    transform 0.2s ease-out;
}

.mva-card:hover,
.mva-card:focus-visible {
  border-color: #ff7a2f;
  background-color: #101719;
  transform: translateY(-2px);
}

/* Фото — как скан: чёрно-белое, цвет возвращается при наведении. */
.mva-card__photo {
  filter: grayscale(1) contrast(1.06) brightness(0.9);
  transition:
    filter 0.4s ease-out,
    transform 0.6s ease-out;
}

.mva-card:hover .mva-card__photo,
.mva-card:focus-visible .mva-card__photo {
  filter: grayscale(0) contrast(1) brightness(1);
  transform: scale(1.04);
}

.mva-card__empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #a29c90;
}

.mva-card__index {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 7px;
  border-bottom: 1px solid rgb(255 255 255 / 0.2);
  border-left: 1px solid rgb(255 255 255 / 0.2);
  background-color: rgb(10 14 17 / 0.86);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #ff9c4a;
}

/* Выноска: короткая оранжевая черта и подпись вида техники поверх фото. */
.mva-card__callout {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 20px);
  padding: 3px 8px;
  border-left: 2px solid #ff7a2f;
  background-color: rgb(10 14 17 / 0.82);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffb27a;
}

.mva-card__callout::before {
  content: "";
  width: 12px;
  height: 1px;
  flex-shrink: 0;
  background-color: #ff7a2f;
}

.mva-card__brand {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #ff9c4a;
}

/* Характеристики — как в спецификации: подпись слева, значение справа. */
.mva-card__spec {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mva-card__spec dt {
  min-width: 0;
  color: #a29c90;
}

.mva-card__spec dd {
  margin-left: auto;
  flex-shrink: 0;
  color: #ddd6c6;
}

.mva-card__price {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.3rem;
  line-height: 1;
  font-weight: 700;
  color: #f4efe2;
}

.mva-card__unit {
  display: block;
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a29c90;
}

.mva-card__go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid rgb(255 122 47 / 0.5);
  color: #ff9c4a;
  transition:
    background-color 0.2s ease-out,
    color 0.2s ease-out;
}

.mva-card:hover .mva-card__go,
.mva-card:focus-visible .mva-card__go {
  background-color: #ff7a2f;
  color: #14100a;
}

.mva-link {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ff9c4a;
  border-bottom: 1px solid rgb(255 122 47 / 0.4);
  padding-block: 3px 4px;
  transition:
    color 0.18s ease-out,
    border-color 0.18s ease-out;
}

.mva-link:hover {
  color: #ff7a2f;
  border-color: #ff7a2f;
}

@media (prefers-reduced-motion: reduce) {
  .mva-card,
  .mva-card:hover,
  .mva-card:focus-visible {
    transform: none;
    transition: none;
  }

  .mva-card__photo,
  .mva-arrow,
  .mva-card__go,
  .mva-link {
    transition: none;
  }
}
</style>

