<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";

/**
 * Вариант D — «Витрина» (собственная версия, продающая).
 *
 * Ставка на коммерцию, а не на декор: в шапке блока — цифры парка, минимальная
 * цена смены и два действия, у каждой надгруппы — ценник на тёмной плашке,
 * у каждой полки — липкий заголовок раздела, стрелки и точки листания. Карточка
 * взята готовая, `HomeModelCard`: белая плита с раскрытием характеристик при
 * наведении. Плотность и ритм делают блок «магазинным», но читаемым: цена, вид
 * и три характеристики видны без клика.
 *
 * Данные и ленты те же, что у остальных версий (`useModelRail`).
 */
const props = defineProps<{
  sections: HomeModelSection[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const rails = useModelRail();

/** Сколько всего машин в блоке — цифра для шапки. */
const totalModels = computed(() =>
  props.sections.reduce(
    (sum, section) => sum + section.shelves.reduce((count, shelf) => count + shelf.models.length, 0),
    0,
  ),
);

/** Минимальная цена смены по всем полкам: «смена от 4 500 ₽». null — цен нет. */
const minShift = computed<number | null>(() => {
  const amounts = props.sections
    .flatMap((section) => section.shelves)
    .flatMap((shelf) => shelf.models)
    .map((model) => Number(model.pricePerShift))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  return amounts.length ? Math.min(...amounts) : null;
});

const heroTitle = computed(() => {
  const models = `${totalModels.value} ${pluralRu(totalModels.value, ["машина", "машины", "машин"])}`;
  const money = minShift.value === null ? null : formatMoney(String(minShift.value));

  return money ? `${models} в парке — смена от ${money} ₽` : `${models} в парке — с экипажем`;
});
</script>

<template>
  <div class="mvd">
    <!-- Шапка блока: продающая, с цифрами и двумя действиями. -->
    <section class="mvd__hero px-5 pt-12 pb-10 md:px-8 lg:pt-16 lg:pb-12">
      <div class="mx-auto max-w-site">
        <span class="mvd__kicker">Каталог моделей</span>

        <h2 class="mvd__title">{{ heroTitle }}</h2>

        <p class="mvd__lead">
          Разложили парк по задачам: земляные работы, погрузка и подъём, дороги, перевозки.
          В карточке — вид, три характеристики и цена смены, чтобы выбрать машину без звонка.
        </p>

        <div class="mvd__actions">
          <a class="mvd__cta mvd__cta--primary" href="#zayavka">Подобрать технику</a>
          <a class="mvd__cta mvd__cta--ghost" href="/katalog">Весь каталог</a>
        </div>

        <dl class="mvd__stats">
          <div>
            <dt>В парке</dt>
            <dd>{{ totalModels }} {{ pluralRu(totalModels, ["машина", "машины", "машин"]) }}</dd>
          </div>
          <div>
            <dt>Надгрупп</dt>
            <dd>{{ sections.length }} {{ pluralRu(sections.length, ["группа", "группы", "групп"]) }}</dd>
          </div>
          <div>
            <dt>Смена от</dt>
            <dd>{{ minShift === null ? "по запросу" : `${formatMoney(String(minShift))} ₽` }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <div class="mvd__body">
      <section
        v-for="section in sections"
        :id="`modeli-d-${section.slug}`"
        :key="section.slug"
        class="px-5 py-12 md:px-8 lg:py-14"
      >
        <div class="mx-auto max-w-site">
          <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div class="min-w-0">
              <span class="mvd__num">{{ section.numberLabel }} · каталог моделей</span>
              <h3 class="mvd__sect-title">{{ section.title }}</h3>
              <p class="mvd__sect-lead">{{ section.lead }}</p>
            </div>

            <!-- Ценник группы: тёмная плашка со срезанным углом. -->
            <div class="mvd__tag">
              <span>смена</span>
              <b>{{ section.priceRange }}</b>
            </div>
          </div>

          <div
            v-for="shelf in section.shelves"
            :key="shelf.category.slug"
            class="mt-9 grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
          >
            <!-- Липкий заголовок полки: пока листаешь ряд, раздел остаётся на виду. -->
            <div class="mvd__shelf-head">
              <span class="mvd__shelf-num">{{ shelf.numberLabel }}</span>
              <h4 class="mvd__shelf-title">
                <NuxtLink :to="categoryPath(shelf.category.slug)">{{
                  shelf.category.title
                }}</NuxtLink>
              </h4>
              <p class="mvd__shelf-meta">
                {{ shelf.modelsLabel }}<span class="mvd__dot-sep" aria-hidden="true">·</span>
                {{ shelf.priceRange }}
              </p>

              <div class="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  class="mvd__arrow"
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
                  class="mvd__arrow"
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

              <div
                v-if="rails.railPagesOf(shelf.category.slug) > 1"
                class="mt-2 flex items-center gap-1"
                role="tablist"
                :aria-label="`Страницы раздела «${shelf.category.title}»`"
              >
                <button
                  v-for="page in rails.railPagesOf(shelf.category.slug)"
                  :key="page"
                  type="button"
                  role="tab"
                  class="mvd__dot"
                  :aria-label="`Страница ${page} из ${rails.railPagesOf(shelf.category.slug)}`"
                  :aria-selected="page - 1 === rails.railPageOf(shelf.category.slug)"
                  @click="rails.goToPage(shelf.category.slug, page - 1)"
                >
                  <span
                    class="mvd__dot-mark"
                    :class="{
                      'mvd__dot-mark--on': page - 1 === rails.railPageOf(shelf.category.slug),
                    }"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <ul
              :ref="(el) => rails.setRail(shelf.category.slug, el)"
              class="mvd__rail flex gap-4 overflow-x-auto pb-1"
              :aria-label="`Модели раздела «${shelf.category.title}»`"
              @scroll.passive="rails.update(shelf.category.slug)"
            >
              <li
                v-for="item in shelf.models"
                :key="item.id"
                class="w-[84vw] shrink-0 p-2 sm:w-[320px] xl:w-[360px]"
              >
                <HomeModelCard :model="item" :city-slug="citySlug" />
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div class="px-5 pb-14 md:px-8">
        <div class="mx-auto max-w-site">
          <div class="mvd__foot">
            <p class="mvd__note">{{ priceDisclaimer }}</p>
            <a class="mvd__cta mvd__cta--primary" href="#zayavka">Узнать цену на свою дату</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mvd {
  background-color: #f5f4ef;
}

/*
 * Шапка блока — фирменный оранжевый градиент с тонкой диагональной штриховкой:
 * цветная полоса лендинга, но со своей фактурой, чтобы блок не читался как
 * копия соседних секций.
 */
.mvd__hero {
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(112deg, #ff9c4a 0%, #ff7a2f 44%, #cf4418 100%);
  color: #14100a;
}

.mvd__hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(20 16 10 / 0.055) 0 2px,
    transparent 2px 12px
  );
  pointer-events: none;
}

.mvd__kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.mvd__kicker::before {
  content: "";
  width: 26px;
  height: 2px;
  background-color: #14100a;
}

.mvd__title {
  margin-top: 0.75rem;
  max-width: 24ch;
  font-size: clamp(1.85rem, 4.5vw, 3.25rem);
  line-height: 1.03;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.mvd__lead {
  margin-top: 1rem;
  max-width: 48ch;
  font-size: 15px;
  line-height: 1.7;
  color: #2b1a10;
}

.mvd__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.6rem;
}

.mvd__cta {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 1.25rem;
  border-radius: 2px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition:
    background-color 0.18s ease-out,
    border-color 0.18s ease-out,
    color 0.18s ease-out;
}

.mvd__cta--primary {
  background-color: #0d1214;
  color: #ffffff;
}

.mvd__cta--primary:hover {
  background-color: #ffffff;
  color: #0d1214;
}

.mvd__cta--ghost {
  border: 1px solid rgb(20 16 10 / 0.45);
  color: #14100a;
}

.mvd__cta--ghost:hover {
  border-color: #14100a;
  background-color: rgb(255 255 255 / 0.28);
}

/* Три цифры парка: тонкие линии вместо плашек — как ценник на витрине. */
.mvd__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 2rem;
  border-top: 1px solid rgb(20 16 10 / 0.25);
  border-bottom: 1px solid rgb(20 16 10 / 0.25);
}

.mvd__stats > div {
  padding: 0.8rem 0.8rem 0.8rem 0;
}

.mvd__stats > div + div {
  padding-left: 0.8rem;
  border-left: 1px solid rgb(20 16 10 / 0.25);
}

.mvd__stats dt {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(20 16 10 / 0.72);
}

.mvd__stats dd {
  margin-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: clamp(0.92rem, 1.4vw, 1.05rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mvd__num {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #b83c12;
}

.mvd__sect-title {
  margin-top: 0.5rem;
  font-size: clamp(1.5rem, 3vw, 2.3rem);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0d1214;
}

.mvd__sect-lead {
  margin-top: 0.5rem;
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.7;
  color: #3d474b;
}

/* Ценник группы: тёмная плашка со срезанным верхним правым углом. */
.mvd__tag {
  padding: 0.6rem 0.9rem 0.65rem 1rem;
  background-color: #0d1214;
  color: #f5f4ef;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
}

.mvd__tag span {
  display: block;
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #ff9c4a;
}

.mvd__tag b {
  display: block;
  margin-top: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Заголовок полки: графитовая черта сверху, на десктопе — липкий. */
.mvd__shelf-head {
  align-self: start;
  padding-top: 0.6rem;
  border-top: 2px solid #0d1214;
}

@media (min-width: 1024px) {
  .mvd__shelf-head {
    position: sticky;
    top: 5.5rem;
  }
}

.mvd__shelf-num {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #b83c12;
}

.mvd__shelf-title {
  margin-top: 0.35rem;
  font-size: 1.1rem;
  line-height: 1.25;
  font-weight: 600;
  color: #0d1214;
}

.mvd__shelf-title a {
  display: inline-block;
  padding-block: 2px;
  transition: color 0.18s ease-out;
}

.mvd__shelf-title a:hover {
  color: #b83c12;
}

.mvd__shelf-meta {
  margin-top: 0.35rem;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5a6469;
}

.mvd__dot-sep {
  margin: 0 0.35rem;
  color: #b8b1a0;
}

.mvd__arrow {
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

.mvd__arrow:hover:not(:disabled) {
  border-color: #0d1214;
  background-color: #0d1214;
  color: #ffffff;
}

.mvd__arrow:disabled {
  cursor: default;
  opacity: 0.35;
}

/* Точка в кнопке 44×44: палец попадает, рисунок остаётся мелким. */
.mvd__dot {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
}

.mvd__dot-mark {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background-color: #c9c4b6;
  transition:
    width 0.2s ease-out,
    background-color 0.2s ease-out;
}

.mvd__dot-mark--on {
  width: 22px;
  background-color: #b83c12;
}

/* `position: relative` — свой containing block для абсолютных потомков карточки
   (`sr-only`), иначе они уезжают мимо clip ленты и растягивают документ. */
.mvd__rail {
  position: relative;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.mvd__rail::-webkit-scrollbar {
  display: none;
}

.mvd__rail > li {
  scroll-snap-align: start;
}

/* Подвал блока: дисклеймер о цене и последний призыв. */
.mvd__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgb(13 18 20 / 0.12);
}

.mvd__note {
  max-width: 48ch;
  font-size: 13px;
  line-height: 1.65;
  color: #3d474b;
}

@media (prefers-reduced-motion: reduce) {
  .mvd__cta,
  .mvd__arrow,
  .mvd__dot-mark,
  .mvd__shelf-title a {
    transition: none;
  }
}
</style>

