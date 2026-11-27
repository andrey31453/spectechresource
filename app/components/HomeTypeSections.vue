<script setup lang="ts">
import { imageVariantUrl } from "#shared/utils/uploads";
import { homeTypeSections } from "~/utils/home-type-cards";
import { typePath } from "~/utils/routes";
import { formatPriceFrom } from "~/utils/price";
import { pluralRu } from "~/utils/plural";
import { modelPage } from "~/utils/model-showcase";
import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";

const props = defineProps<{ categories: CategoryCardDto[]; models: HomeModelDto[]; priceDisclaimer: string }>();
const sections = computed(() => homeTypeSections(props.categories, props.models));
const pages = ref<Record<string, number>>({});
const directions = ref<Record<string, "next" | "previous">>({});
const pageSize = ref(2);
let removeMediaListeners: (() => void) | undefined;

onMounted(() => {
  const desktop = window.matchMedia("(min-width: 1280px)");
  const tablet = window.matchMedia("(min-width: 768px)");
  const update = () => {
    pageSize.value = desktop.matches ? 4 : tablet.matches ? 3 : 2;
    pages.value = {};
  };
  update();
  desktop.addEventListener("change", update);
  tablet.addEventListener("change", update);
  removeMediaListeners = () => {
    desktop.removeEventListener("change", update);
    tablet.removeEventListener("change", update);
  };
});
onBeforeUnmount(() => removeMediaListeners?.());

function pagination(section: (typeof sections.value)[number]) {
  return modelPage(section.cards, pages.value[section.slug] ?? 0, pageSize.value);
}

function changePage(section: (typeof sections.value)[number], page: number) {
  const current = pagination(section);
  const target = Math.min(Math.max(0, page), current.count - 1);
  if (target === current.index) return;
  directions.value[section.slug] = target > current.index ? "next" : "previous";
  pages.value[section.slug] = target;
}

function disableLeavingPage(element: Element) {
  element.setAttribute("inert", "");
  element.setAttribute("aria-hidden", "true");
}
</script>

<template>
  <div data-home-types>
    <section v-for="section in sections" :id="`modeli-h-${section.slug}`" :key="section.slug" :aria-labelledby="`types-title-${section.slug}`" class="overflow-hidden px-5 py-[148px] md:px-8 md:py-[180px]" :class="section.colorTheme === 'BLACK' ? 'bg-ink text-sand' : section.colorTheme === 'ORANGE' ? 'bg-flame text-ink' : 'bg-cement2 text-ink'">
      <div class="mx-auto max-w-site">
        <h2 :id="`types-title-${section.slug}`" class="m-0! max-w-5xl text-[clamp(32px,5.8vw,80px)]! leading-[.98]! font-extrabold tracking-[-.055em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ section.title }}</h2>
        <p v-if="section.lead" class="mt-5! mb-0! max-w-2xl text-lg leading-relaxed text-inherit!">{{ section.lead }}</p>
        <div :id="`type-cards-${section.slug}`" class="mt-10 grid! min-w-0 overflow-hidden p-1 -mx-1" aria-live="polite" aria-atomic="true">
        <Transition
          enter-active-class="transition-transform duration-350 ease-in-out motion-reduce:transition-none!"
          leave-active-class="pointer-events-none transition-transform duration-350 ease-in-out motion-reduce:transition-none!"
          :enter-from-class="directions[section.slug] === 'previous' ? '-translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!' : 'translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!'"
          :leave-to-class="directions[section.slug] === 'previous' ? 'translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!' : '-translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!'"
          @before-leave="disableLeavingPage"
        >
        <div :key="`${pageSize}-${pagination(section).index}`" class="grid! min-w-0 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 [grid-area:1/1]" data-type-cards>
          <article v-for="type in pagination(section).models" :key="type.slug" class="flex min-w-0 overflow-hidden rounded-card border border-line bg-white text-ink" :data-type-slug="type.slug">
            <NuxtLink :to="typePath(type.slug)" class="group flex w-full min-w-0 flex-col text-ink! no-underline! focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink">
              <div class="grid! aspect-[16/10] place-items-center overflow-hidden bg-cement">
                <img v-if="type.image" :src="imageVariantUrl(type.image, 'small')" :alt="type.name" width="480" height="300" loading="lazy" class="h-full w-full object-cover">
                <span v-else class="p-5 text-center text-sm">Фото уточняйте у менеджера</span>
              </div>
              <div class="flex flex-1 flex-col p-3 md:p-5">
                <h3 class="m-0! text-xl! leading-snug! font-bold text-ink! [overflow-wrap:anywhere] group-hover:underline">{{ type.name }}</h3>
                <p class="mt-3! mb-0! text-sm text-muted!">{{ type.modelsCount }} {{ pluralRu(type.modelsCount, ['модель', 'модели', 'моделей']) }} техники</p>
                <p v-if="type.description" class="mt-3! mb-0! line-clamp-3 text-sm leading-relaxed text-ink! [overflow-wrap:anywhere]">{{ type.description }}</p>
                <p class="mt-auto! mb-0! pt-5 text-lg font-bold text-ink!">{{ formatPriceFrom(type.priceFrom, type.priceUnit) }}</p>
              </div>
            </NuxtLink>
          </article>
        </div>
        </Transition>
        </div>
        <nav v-if="pagination(section).count > 1" class="mt-8 flex flex-wrap items-center justify-center gap-3" :aria-label="`Страницы видов техники: ${section.title}`">
          <button type="button" aria-label="Предыдущая страница видов техники" :aria-controls="`type-cards-${section.slug}`" :disabled="pagination(section).index === 0" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="changePage(section, pagination(section).index - 1)">←</button>
          <div class="flex flex-wrap justify-center" role="group" aria-label="Выбор страницы видов техники">
            <button v-for="page in pagination(section).count" :key="page" type="button" :aria-label="`Страница ${page} из ${pagination(section).count}`" :aria-controls="`type-cards-${section.slug}`" :aria-current="pagination(section).index === page - 1 ? 'page' : undefined" class="group grid! size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" @click="changePage(section, page - 1)">
              <span aria-hidden="true" class="size-2.5 rounded-full bg-current" :class="pagination(section).index === page - 1 ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'" />
            </button>
          </div>
          <button type="button" aria-label="Следующая страница видов техники" :aria-controls="`type-cards-${section.slug}`" :disabled="pagination(section).index === pagination(section).count - 1" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="changePage(section, pagination(section).index + 1)">→</button>
        </nav>
      </div>
    </section>
    <p class="m-0! bg-ink px-5 py-6 text-sm leading-relaxed text-fog! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>