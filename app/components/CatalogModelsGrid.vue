<script setup lang="ts">
import type { HomeModelDto } from "~/types/catalog";
import { modelPath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";

withDefaults(defineProps<{ models: HomeModelDto[]; wide?: boolean; equipmentTypeSlug?: string; equipmentLabel?: string }>(), { wide: false, equipmentTypeSlug: undefined, equipmentLabel: undefined });
</script>

<template>
  <div v-if="models.length" class="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2" :class="wide ? 'lg:grid-cols-3 xl:grid-cols-4' : 'xl:grid-cols-3'" data-catalog-models>
    <article v-for="model in models" :key="model.id" class="flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-white text-ink" :data-type-slug="model.typeSlug">
      <CatalogPhotoCarousel :photos="model.photos" :title="`${model.brand} ${model.model}`" :href="modelPath(model.typeSlug, model.slug)" />
      <NuxtLink :to="modelPath(model.typeSlug, model.slug)" class="group flex flex-1 flex-col text-ink! no-underline! focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink">
        <div class="flex flex-1 flex-col p-5">
          <p class="m-0! text-sm text-muted!">{{ model.typeName }}</p>
          <h3 class="mt-2! mb-0! text-xl! leading-snug! font-bold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</h3>
          <p v-if="model.shortDesc" class="mt-3! mb-0! whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]">{{ model.shortDesc }}</p>
          <ModelSpecs :specs="model.specs" class="mt-5 border-t border-line pt-4" />
          <div class="mt-auto pt-5">
            <p class="m-0! text-lg font-bold text-ink!">{{ model.pricePerShift ? `${formatMoney(model.pricePerShift)} ₽ / смена` : model.pricePerHour ? `${formatMoney(model.pricePerHour)} ₽ / час` : 'Цена по запросу' }}</p>
            <p v-if="model.pricePerShift && model.pricePerHour" class="mt-1! mb-0! text-sm text-muted!">{{ formatMoney(model.pricePerHour) }} ₽ / час</p>
            <span class="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-field bg-ink px-4 py-3 text-sm font-bold text-white transition-colors group-hover:bg-ink2 motion-reduce:transition-none">Подробнее о технике <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </NuxtLink>
    </article>
  </div>
  <div v-else class="flex min-w-0 flex-col gap-5 rounded-card border border-danger-line bg-danger-soft p-6 text-ink sm:flex-row sm:gap-6 sm:p-8" data-catalog-empty>
    <svg aria-hidden="true" class="size-16 shrink-0 text-danger sm:size-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6m0 4h.01" />
    </svg>
    <div class="min-w-0 flex-1">
      <div role="status">
        <h3 class="mt-0! mb-0! text-xl! leading-snug! font-bold text-ink sm:text-2xl!">Нет техники в списке? Поможем решить вашу задачу</h3>
        <p class="mt-3! mb-0! max-w-3xl text-base leading-relaxed text-ink">Сейчас в этом виде техники нет доступных моделей в каталоге. Но мы всё равно можем помочь: расскажите, какие работы нужно выполнить. Уточним наличие, обсудим вашу задачу и предложим возможные варианты решения.</p>
      </div>
      <SiteButton href="#zayavka" :data-equipment-type-slug="equipmentTypeSlug" :data-equipment-label="equipmentLabel" class="mt-6 w-full sm:w-auto motion-reduce:transition-none" with-arrow>
        Обсудить задачу
      </SiteButton>
    </div>
  </div>
</template>