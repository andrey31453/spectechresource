<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";

/**
 * Вариант C — «Полка-паспорт».
 *
 * Каталог как паспорт машины: белый лист, тонкие линии-волоски, крупный индекс
 * 01/07 у каждой позиции, плотный ритм метаданных моно-кеглем и цена главным
 * акцентом справа. Лент и стрелок нет: позиции разложены сеткой, поэтому весь
 * раздел видно сразу — версия для тех, кто выбирает по цифрам, а не листает фото.
 *
 * Сетка сделана на `gap: 1px` по подложке цвета линии: так линии остаются
 * волосяными и не удваиваются на стыках ячеек.
 */
defineProps<{
  sections: HomeModelSection[];
  citySlug: string;
  priceDisclaimer: string;
}>();

/** Две характеристики в одну строку: «Грузоподъёмность 3,5 т · Ковш 1,8 м³». */
function specLine(specs: Array<{ name: string; value: string }>): string {
  return specs
    .slice(0, 2)
    .map((spec) => `${spec.name} ${spec.value}`)
    .join(" · ");
}
</script>

<template>
  <div class="mvc">
    <section
      v-for="section in sections"
      :id="`modeli-c-${section.slug}`"
      :key="section.slug"
      class="border-t border-[#e7e1d1] px-5 py-12 first:border-t-0 md:px-8 lg:py-16"
    >
      <div class="mx-auto max-w-site">
        <header class="grid items-start gap-5 md:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-8">
          <span class="mvc__num" aria-hidden="true">{{ section.number }}</span>

          <div class="min-w-0">
            <h2
              class="text-[clamp(1.4rem,2.8vw,2.15rem)] leading-tight font-semibold tracking-tight text-[#0d1214]"
            >
              {{ section.title }}
            </h2>
            <p class="mt-2 max-w-3xl text-[15px] leading-7 text-[#3d474b]">{{ section.lead }}</p>

            <dl class="mvc__facts">
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
        </header>

        <div v-for="shelf in section.shelves" :key="shelf.category.slug" class="mt-8">
          <div class="mvc__shelf">
            <span class="mvc__shelf-num">{{ shelf.numberLabel }}</span>
            <NuxtLink :to="categoryPath(shelf.category.slug)" class="mvc__shelf-title">{{
              shelf.category.title
            }}</NuxtLink>
            <span class="mvc__shelf-meta">{{ shelf.modelsLabel }} · {{ shelf.priceRange }}</span>
          </div>

          <ul class="mvc-grid">
            <li v-for="(item, modelIndex) in shelf.models" :key="item.id">
              <NuxtLink :to="typePath(item.typeSlug, citySlug)" class="mvc-card group">
                <span class="mvc-card__thumb">
                  <img
                    v-if="item.photo"
                    class="mvc-card__photo"
                    :src="item.photo"
                    :alt="`${item.brand} ${item.model} — ${item.typeName}`"
                    width="144"
                    height="108"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else class="mvc-card__nophoto">нет фото</span>
                </span>

                <span class="mvc-card__body">
                  <span class="mvc-card__top">
                    <b class="mvc-card__index">{{ String(modelIndex + 1).padStart(2, "0") }}</b>
                    <span class="mvc-card__brand">{{ item.brand }}</span>
                  </span>
                  <span class="mvc-card__name">{{ item.model }}</span>
                  <span v-if="item.specs.length" class="mvc-card__specs">{{
                    specLine(item.specs)
                  }}</span>
                </span>

                <span class="mvc-card__price">
                  <b>{{ formatPrice(item.pricePerShift) }}</b>
                  <span class="mvc-card__unit">смена 8 ч</span>
                </span>

                <span class="sr-only">— открыть карточку вида</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <p class="mx-auto max-w-site px-5 pb-10 text-[13px] leading-6 text-[#5a6469] md:px-8">
      {{ priceDisclaimer }}
    </p>
  </div>
</template>

<style scoped>
.mvc {
  background-color: #ffffff;
}

/* Номер надгруппы — контурный: держит вес, но не спорит с заголовком. */
.mvc__num {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #ffffff;
  -webkit-text-stroke: 1px #c9c2ae;
}

.mvc__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.75rem;
  margin-top: 0.9rem;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mvc__facts > div {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
}

.mvc__facts dt {
  color: #5a6469;
}

.mvc__facts dd {
  color: #0d1214;
  font-weight: 600;
  letter-spacing: 0.06em;
}

/* Полка: номер, название раздела, мета — одной строкой на графитовой линии. */
.mvc__shelf {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #0d1214;
}

.mvc__shelf-num {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: #b83c12;
}

.mvc__shelf-title {
  display: inline-block;
  padding-block: 2px;
  font-size: 1.02rem;
  font-weight: 600;
  color: #0d1214;
  transition: color 0.18s ease-out;
}

.mvc__shelf-title:hover {
  color: #b83c12;
}

.mvc__shelf-meta {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5a6469;
}

/*
 * Сетка на подложке цвета линии: `gap: 1px` даёт волосяные разделители,
 * которые не удваиваются на стыках ячеек.
 */
.mvc-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  background-color: #e7e1d1;
  border-bottom: 1px solid #e7e1d1;
}

@media (min-width: 768px) {
  .mvc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .mvc-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.mvc-grid > li {
  background-color: #ffffff;
}

/* Строка паспорта: фото-талон, индекс, бренд, модель, характеристики, цена. */
.mvc-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 12px 14px;
  transition:
    background-color 0.18s ease-out,
    box-shadow 0.18s ease-out;
}

.mvc-card:hover,
.mvc-card:focus-visible {
  background-color: #fbf9f4;
  box-shadow: inset 2px 0 0 #b83c12;
}

.mvc-card__thumb {
  display: block;
  width: 72px;
  height: 56px;
  overflow: hidden;
  background-color: #f1eee4;
}

.mvc-card__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.15);
  transition:
    transform 0.35s ease-out,
    filter 0.35s ease-out;
}

.mvc-card:hover .mvc-card__photo,
.mvc-card:focus-visible .mvc-card__photo {
  transform: scale(1.06);
  filter: grayscale(0);
}

.mvc-card__nophoto {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a8a190;
}

.mvc-card__body {
  display: block;
  min-width: 0;
}

.mvc-card__top {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

/* Крупный индекс паспорта — первое, за что цепляется глаз в строке. */
.mvc-card__index {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #5a6469;
  transition: color 0.18s ease-out;
}

.mvc-card:hover .mvc-card__index,
.mvc-card:focus-visible .mvc-card__index {
  color: #b83c12;
}

.mvc-card__brand {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5a6469;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mvc-card__name {
  display: block;
  margin-top: 0.15rem;
  overflow: hidden;
  font-size: 1rem;
  line-height: 1.25;
  font-weight: 600;
  color: #0d1214;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mvc-card__specs {
  display: block;
  margin-top: 0.3rem;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5a6469;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Цена — главный акцент: единственный цветной элемент строки. */
.mvc-card__price {
  display: block;
  text-align: right;
  white-space: nowrap;
}

.mvc-card__price b {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  line-height: 1.1;
  font-weight: 700;
  color: #b83c12;
  transition: color 0.18s ease-out;
}

.mvc-card:hover .mvc-card__price b,
.mvc-card:focus-visible .mvc-card__price b {
  color: #0d1214;
}

.mvc-card__unit {
  display: block;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5a6469;
}

@media (prefers-reduced-motion: reduce) {
  .mvc-card,
  .mvc-card__photo,
  .mvc-card__index,
  .mvc-card__price b,
  .mvc__shelf-title {
    transition: none;
  }

  .mvc-card:hover .mvc-card__photo,
  .mvc-card:focus-visible .mvc-card__photo {
    transform: none;
  }
}
</style>

