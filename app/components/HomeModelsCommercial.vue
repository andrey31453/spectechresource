<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";

/**
 * Вариант E — «Коммерческая витрина».
 *
 * Продающий гибрид: сначала обещание и цена входа, затем короткие полки
 * с машиной, характеристиками и понятным переходом к заявке. В отличие от
 * варианта D карточка не инвертируется целиком: цена и фото остаются главным
 * якорем, а технические данные помогают принять решение без звонка.
 */
const props = defineProps<{
  sections: HomeModelSection[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const rails = useModelRail();

const totalModels = computed(() =>
  props.sections.reduce(
    (sum, section) => sum + section.shelves.reduce((count, shelf) => count + shelf.models.length, 0),
    0,
  ),
);

const minShift = computed<number | null>(() => {
  const amounts = props.sections
    .flatMap((section) => section.shelves)
    .flatMap((shelf) => shelf.models)
    .map((model) => Number(model.pricePerShift))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  return amounts.length ? Math.min(...amounts) : null;
});

const minShiftLabel = computed(() =>
  minShift.value === null ? "по запросу" : `${formatMoney(String(minShift.value))} ₽`,
);
</script>

<template>
  <div class="mve">
    <section class="mve__hero px-5 py-10 md:px-8 lg:py-14">
      <div class="mx-auto max-w-site">
        <div class="mve__hero-grid">
          <div>
            <span class="mve__kicker">Каталог моделей · подбор за 5 минут</span>
            <h2 class="mve__title">Техника под задачу — с ценой смены на экране</h2>
            <p class="mve__lead">
              Сравните реальные модели парка по характеристикам и стоимости. Выберите подходящую
              машину или оставьте задачу — менеджер быстро предложит замену.
            </p>
            <div class="mve__actions">
              <a class="mve__cta mve__cta--primary" href="#zayavka">Подобрать технику</a>
              <a class="mve__cta mve__cta--quiet" href="/katalog">Открыть весь каталог</a>
            </div>
          </div>

          <dl class="mve__offer">
            <div class="mve__offer-price">
              <dt>Смена от</dt>
              <dd>{{ minShiftLabel }}</dd>
            </div>
            <div>
              <dt>В парке</dt>
              <dd>{{ totalModels }} {{ pluralRu(totalModels, ["машина", "машины", "машин"]) }}</dd>
            </div>
            <div>
              <dt>Подбор</dt>
              <dd>по задаче</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <div class="mve__body">
      <section
        v-for="section in sections"
        :id="`modeli-e-${section.slug}`"
        :key="section.slug"
        class="mve__section px-5 py-10 md:px-8 lg:py-14"
      >
        <div class="mx-auto max-w-site">
          <header class="mve__section-head">
            <div>
              <span class="mve__section-index">{{ section.numberLabel }} · {{ section.modelsLabel }}</span>
              <h3>{{ section.title }}</h3>
            </div>
            <span class="mve__section-price">{{ section.priceRange }}</span>
          </header>

          <div
            v-for="shelf in section.shelves"
            :key="shelf.category.slug"
            class="mve__shelf"
          >
            <div class="mve__shelf-head">
              <NuxtLink :to="categoryPath(shelf.category.slug)" class="mve__shelf-title">
                {{ shelf.numberLabel }} <span>{{ shelf.category.title }}</span>
              </NuxtLink>
              <div class="mve__controls">
                <span class="mve__shelf-meta">{{ shelf.modelsLabel }}</span>
                <button
                  type="button"
                  class="mve__arrow"
                  :disabled="rails.railPageOf(shelf.category.slug) === 0"
                  :aria-label="`Предыдущие модели раздела «${shelf.category.title}»`"
                  @click="rails.scrollRail(shelf.category.slug, -1)"
                >←</button>
                <button
                  type="button"
                  class="mve__arrow"
                  :disabled="rails.railPageOf(shelf.category.slug) >= rails.railPagesOf(shelf.category.slug) - 1"
                  :aria-label="`Следующие модели раздела «${shelf.category.title}»`"
                  @click="rails.scrollRail(shelf.category.slug, 1)"
                >→</button>
              </div>
            </div>

            <ul
              :ref="(el) => rails.setRail(shelf.category.slug, el)"
              class="mve__rail"
              :aria-label="`Модели раздела «${shelf.category.title}»`"
              @scroll.passive="rails.update(shelf.category.slug)"
            >
              <li v-for="(item, modelIndex) in shelf.models" :key="item.id" class="mve__item">
                <NuxtLink :to="typePath(item.typeSlug, citySlug)" class="mve__card">
                  <div class="mve__photo-wrap">
                    <img
                      v-if="item.photo"
                      class="mve__photo"
                      :src="item.photo"
                      :alt="`${item.brand} ${item.model} — ${item.typeName}`"
                      width="720"
                      height="450"
                      loading="lazy"
                      decoding="async"
                    >
                    <span v-else class="mve__empty">фото готовится</span>
                    <span class="mve__index" aria-hidden="true">{{ String(modelIndex + 1).padStart(2, "0") }}</span>
                    <span class="mve__photo-cta" aria-hidden="true">Выбрать машину →</span>
                  </div>
                  <div class="mve__card-body">
                    <div class="mve__card-top">
                      <span class="mve__brand">{{ item.brand }}</span>
                      <span class="mve__type">{{ item.typeName }}</span>
                    </div>
                    <h4>{{ item.model }}</h4>
                    <dl v-if="item.specs.length" class="mve__specs">
                      <div v-for="spec in item.specs.slice(0, 3)" :key="spec.name">
                        <dt>{{ spec.name }}</dt>
                        <dd>{{ spec.value }}</dd>
                      </div>
                    </dl>
                    <div class="mve__price-row">
                      <span>
                        <b>{{ formatPrice(item.pricePerShift) }}</b>
                        <small>/ смена 8 ч</small>
                      </span>
                      <span class="mve__go" aria-hidden="true">↗</span>
                    </div>
                    <span class="sr-only">— открыть карточку вида</span>
                  </div>
                </NuxtLink>
              </li>
            </ul>

            <div
              v-if="rails.railPagesOf(shelf.category.slug) > 1"
              class="mve__dots"
              role="tablist"
              :aria-label="`Страницы раздела «${shelf.category.title}»`"
            >
              <button
                v-for="page in rails.railPagesOf(shelf.category.slug)"
                :key="page"
                type="button"
                role="tab"
                class="mve__dot"
                :aria-label="`Страница ${page} из ${rails.railPagesOf(shelf.category.slug)}`"
                :aria-selected="page - 1 === rails.railPageOf(shelf.category.slug)"
                @click="rails.goToPage(shelf.category.slug, page - 1)"
              >
                <span :class="{ 'mve__dot-mark--on': page - 1 === rails.railPageOf(shelf.category.slug) }" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="mve__foot px-5 py-10 md:px-8">
      <div class="mx-auto flex max-w-site flex-wrap items-center justify-between gap-5">
        <p>{{ priceDisclaimer }}</p>
        <a class="mve__cta mve__cta--primary" href="#zayavka">Узнать цену на свою дату</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mve { width: 100%; max-width: 100%; min-width: 0; overflow-x: clip; background: #f5f4ef; color: #0d1214; }
.mve__hero, .mve__body, .mve__section, .mve__foot { width: 100%; min-width: 0; }
.mve__hero { background: #0d1214; color: #f5f4ef; }
.mve__hero-grid { display: grid; min-width: 0; max-width: 100%; gap: 2rem; }
.mve__kicker, .mve__section-index, .mve__brand, .mve__type, .mve__shelf-meta, .mve__offer dt, .mve__specs { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .14em; }
.mve__kicker { color: #ff9c4a; font-size: 10px; font-weight: 700; }
.mve__title { max-width: 13ch; margin-top: .8rem; font-size: clamp(2rem, 5vw, 4.2rem); line-height: .98; letter-spacing: -.04em; font-weight: 700; }
.mve__lead { max-width: 54ch; margin-top: 1.25rem; color: #c5c3bb; font-size: 15px; line-height: 1.7; }
.mve__actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.75rem; }
.mve__cta { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; padding: 0 1.2rem; border: 1px solid transparent; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; transition: background-color .18s ease, color .18s ease, border-color .18s ease; }
.mve__cta--primary { background: #ff7a2f; color: #0d1214; }
.mve__cta--primary:hover, .mve__cta--primary:focus-visible { background: #fff; color: #0d1214; }
.mve__cta--quiet { border-color: #657076; color: #f5f4ef; }
.mve__cta--quiet:hover, .mve__cta--quiet:focus-visible { border-color: #ff9c4a; color: #ff9c4a; }
.mve__offer { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-self: end; border-top: 1px solid #435057; border-bottom: 1px solid #435057; }
.mve__offer > div { min-width: 0; padding: 1rem .75rem 1rem 0; }
.mve__offer > div + div { padding-left: .75rem; border-left: 1px solid #435057; }
.mve__offer dt { color: #9da7aa; font-size: 9px; }
.mve__offer dd { margin-top: .45rem; color: #fff; font-size: clamp(.85rem, 2vw, 1.15rem); font-weight: 700; }
.mve__offer-price dd { color: #ff9c4a; font-size: clamp(1.05rem, 3vw, 1.65rem); }
.mve__section { border-bottom: 1px solid #ddd8ca; }
.mve__section-head, .mve__shelf-head { display: flex; min-width: 0; max-width: 100%; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: .75rem 1.5rem; }
.mve__section-head { padding-bottom: 1.25rem; border-bottom: 2px solid #0d1214; }
.mve__section-index { color: #b83c12; font-size: 10px; font-weight: 700; }
.mve__section-head h3 { margin-top: .5rem; font-size: clamp(1.55rem, 3vw, 2.5rem); line-height: 1; letter-spacing: -.03em; }
.mve__section-price { color: #4f5b5e; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; }
.mve__shelf { margin-top: 2rem; }
.mve__shelf-head { margin-bottom: .75rem; }
.mve__shelf-title { color: #0d1214; font-size: 1.05rem; font-weight: 700; }
.mve__shelf-title:first-letter { color: #b83c12; }
.mve__shelf-title:hover { color: #b83c12; }
.mve__controls { display: flex; align-items: center; gap: .45rem; }
.mve__shelf-meta { color: #4f5b5e; font-size: 9px; }
.mve__arrow { display: inline-flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid #b9b5a9; color: #0d1214; font-size: 1rem; transition: background-color .18s ease, color .18s ease, border-color .18s ease; }
.mve__arrow:hover:not(:disabled), .mve__arrow:focus-visible:not(:disabled) { border-color: #b83c12; background: #b83c12; color: #fff; }
.mve__arrow:disabled { cursor: not-allowed; opacity: .3; }
.mve__rail { display: flex; width: 100%; min-width: 0; max-width: 100%; gap: 1rem; overflow-x: auto; padding: .25rem .25rem 1rem 0; scrollbar-width: none; overscroll-behavior-x: contain; }
.mve__rail::-webkit-scrollbar { display: none; }
.mve__item { width: 82vw; flex: 0 0 auto; padding: .35rem .35rem .65rem 0; scroll-snap-align: start; }
.mve__card { display: flex; height: 100%; flex-direction: column; overflow: hidden; border: 1px solid #d6d0c0; background: #fff; box-shadow: 0 2px 0 rgb(13 18 20 / 8%); transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
.mve__card:hover, .mve__card:focus-visible { border-color: #ff7a2f; box-shadow: 0 18px 26px -18px rgb(13 18 20 / 65%); transform: translateY(-6px); }
.mve__photo-wrap { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: #e6e2d7; }
.mve__photo { width: 100%; height: 100%; object-fit: cover; transition: transform .45s ease, filter .45s ease; }
.mve__card:hover .mve__photo, .mve__card:focus-visible .mve__photo { transform: scale(1.06); filter: brightness(.76); }
.mve__empty { display: grid; height: 100%; place-items: center; color: #776f61; font: 10px var(--font-mono); text-transform: uppercase; }
.mve__index { position: absolute; top: .7rem; left: .7rem; padding: .35rem .45rem; background: #0d1214; color: #ff9c4a; font: 700 11px var(--font-mono); letter-spacing: .12em; }
.mve__photo-cta { position: absolute; right: .75rem; bottom: .7rem; color: #fff; font: 700 10px var(--font-mono); letter-spacing: .1em; opacity: 0; transform: translateY(5px); transition: opacity .2s ease, transform .2s ease; }
.mve__card:hover .mve__photo-cta, .mve__card:focus-visible .mve__photo-cta { opacity: 1; transform: translateY(0); }
.mve__card-body { display: flex; min-height: 206px; flex: 1; flex-direction: column; padding: 1rem; }
.mve__card-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .4rem; }
.mve__brand { color: #b83c12; font-size: 10px; font-weight: 700; }
.mve__type { color: #4f5b5e; font-size: 9px; letter-spacing: .08em; }
.mve__card h4 { margin-top: .45rem; font-size: 1.25rem; line-height: 1.05; letter-spacing: -.02em; }
.mve__specs { display: grid; gap: .35rem; margin-top: 1rem; padding-top: .75rem; border-top: 1px solid #e1ddd2; font-size: 9px; letter-spacing: .04em; text-transform: none; }
.mve__specs div { display: flex; justify-content: space-between; gap: .75rem; }
.mve__specs dt { min-width: 0; overflow: hidden; color: #4f5b5e; text-overflow: ellipsis; white-space: nowrap; }
.mve__specs dd { flex-shrink: 0; color: #0d1214; font-weight: 700; }
.mve__price-row { display: flex; align-items: end; justify-content: space-between; gap: .5rem; margin-top: auto; padding-top: .9rem; }
.mve__price-row b { color: #b83c12; font-size: 1.3rem; line-height: 1; }
.mve__price-row small { display: block; margin-top: .25rem; color: #4f5b5e; font: 10px var(--font-mono); }
.mve__go { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid #b9b5a9; color: #b83c12; font-size: 1.1rem; transition: background-color .18s ease, color .18s ease; }
.mve__card:hover .mve__go, .mve__card:focus-visible .mve__go { background: #ff7a2f; color: #0d1214; }
.mve__dots { display: flex; gap: .15rem; padding-top: .15rem; }
.mve__dot { display: grid; width: 28px; height: 28px; place-items: center; }
.mve__dot span { width: 7px; height: 7px; border-radius: 50%; background: #c5c0b3; }
.mve__dot-mark--on { background: #b83c12 !important; }
.mve__foot { background: #e8e3d6; color: #505b5e; }
.mve__foot p { max-width: 62ch; font-size: 13px; line-height: 1.6; }
@media (min-width: 640px) { .mve__item { width: 320px; } }
@media (min-width: 768px) { .mve__hero-grid { grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr); gap: 4rem; } .mve__item { width: 320px; } }
@media (min-width: 1280px) { .mve__item { width: 360px; } }
@media (prefers-reduced-motion: reduce) { .mve__card, .mve__photo, .mve__photo-cta, .mve__cta, .mve__arrow, .mve__go { transition: none; } .mve__card:hover, .mve__card:focus-visible { transform: none; } }
</style>