<script setup lang="ts">
import { homeTypeSections } from "~/utils/home-type-cards";
import { typePath } from "~/utils/routes";
import { formatPriceFrom } from "~/utils/price";
import { pluralRu } from "~/utils/plural";
import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";

const props = defineProps<{ categories: CategoryCardDto[]; models: HomeModelDto[]; priceDisclaimer: string }>();
const sections = computed(() => homeTypeSections(props.categories, props.models));
</script>

<template>
  <div data-home-types>
    <section v-for="section in sections" :id="`modeli-h-${section.slug}`" :key="section.slug" :aria-labelledby="`types-title-${section.slug}`" class="overflow-hidden px-5 py-[148px] md:px-8 md:py-[180px]" :class="section.colorTheme === 'BLACK' ? 'bg-ink text-sand' : section.colorTheme === 'ORANGE' ? 'bg-flame text-ink' : 'bg-cement2 text-ink'">
      <div class="mx-auto max-w-site">
        <h2 :id="`types-title-${section.slug}`" class="m-0! max-w-5xl text-[clamp(32px,5.8vw,80px)]! leading-[.98]! font-extrabold tracking-[-.055em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ section.title }}</h2>
        <p v-if="section.lead" class="mt-5! mb-0! max-w-2xl text-lg leading-relaxed text-inherit!">{{ section.lead }}</p>
        <EquipmentCarousel
          :id="`type-cards-${section.slug}`" class="mt-10"
          :items="section.cards" :item-key="type => type.slug"
          :image="type => type.image" :title="type => type.name"
          :href="type => typePath(type.slug)" :label="`Виды техники: ${section.title}`"
        >
          <template #content="{ item: type }">
            <div class="flex flex-1 flex-col p-3 md:p-5">
              <h3 class="m-0! text-xl! leading-snug! font-bold text-ink! [overflow-wrap:anywhere] group-hover:underline">{{ type.name }}</h3>
              <p class="mt-3! mb-0! text-sm text-muted!">{{ type.modelsCount }} {{ pluralRu(type.modelsCount, ['модель', 'модели', 'моделей']) }} техники</p>
              <p v-if="type.description" class="mt-3! mb-0! line-clamp-3 text-sm leading-relaxed text-ink! [overflow-wrap:anywhere]">{{ type.description }}</p>
              <p class="mt-auto! mb-0! pt-5 text-lg font-bold text-ink!">{{ formatPriceFrom(type.priceFrom, type.priceUnit) }}</p>
            </div>
          </template>
        </EquipmentCarousel>
      </div>
    </section>
    <p class="m-0! bg-ink px-5 py-6 text-sm leading-relaxed text-fog! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>