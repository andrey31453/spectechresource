<script setup lang="ts">
import type { ServiceEquipmentDto } from "~/types/catalog";
import { serviceShowcaseSelection } from "~/utils/service-showcase";
import { modelPath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";

const props = defineProps<{ equipment: ServiceEquipmentDto; priceDisclaimer?: string }>();
const selectedType = ref("");
const selectedModel = ref("");
const selection = computed(() => serviceShowcaseSelection(props.equipment, selectedType.value, selectedModel.value));

function chooseType(slug: string) {
  if (selection.value.type?.slug === slug) return;
  selectedType.value = slug;
  selectedModel.value = "";
}
</script>

<template>
  <section v-if="equipment.types.length" id="service-equipment" class="bg-night text-snow" aria-labelledby="service-equipment-title">
    <div class="mx-auto max-w-site px-5 py-16 md:px-8 md:py-24">
      <p class="mb-4 font-mono text-xs uppercase tracking-widest text-flame2">Техника для вашей задачи</p>
      <h2 id="service-equipment-title" class="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">Выберите машину для работ</h2>
      <div class="grid min-w-0 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <div class="flex min-w-0 flex-col gap-2 self-start" role="group" aria-label="Виды техники для услуги">
          <button
            v-for="type in equipment.types" :key="type.slug" type="button"
            :aria-pressed="selection.type?.slug === type.slug" :data-service-type="type.slug"
            class="min-h-12 rounded-field border px-4 py-3 text-left text-base font-semibold transition-colors hover:border-flame focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame motion-reduce:transition-none"
            :class="selection.type?.slug === type.slug ? 'border-flame bg-flame text-ink' : 'border-mist bg-transparent text-snow'"
            @click="chooseType(type.slug)"
          >{{ type.name }}</button>
        </div>
        <div class="min-w-0">
          <article v-if="selection.model" data-service-selected :data-model-id="selection.model.id" class="min-w-0">
            <div class="grid min-w-0 items-start gap-6 xl:grid-cols-2 xl:gap-8">
              <div class="overflow-hidden rounded-card bg-white/5">
                <img v-if="selection.model.photo" :src="selection.model.photo" :alt="`${selection.model.brand} ${selection.model.model}`" width="800" height="600" loading="lazy" class="aspect-[4/3] w-full object-contain">
                <p v-else class="m-0 grid aspect-[4/3] place-items-center px-6 text-fog">Фото уточняйте при заказе</p>
              </div>
              <div class="min-w-0">
                <p class="mb-3 text-sm text-fog">{{ selection.type?.name }}</p>
                <h3 class="mb-6 text-2xl font-semibold leading-tight [overflow-wrap:anywhere] md:text-3xl">{{ selection.model.brand }} {{ selection.model.model }}</h3>
                <ModelSpecs v-if="selection.model.specs.length" :specs="selection.model.specs" />
                <p v-else class="text-sm text-fog">Характеристики уточняйте при заказе.</p>
                <p class="mb-0 mt-6 text-xl font-semibold">{{ selection.model.pricePerShift ? `${formatMoney(selection.model.pricePerShift)} ₽ / смена` : selection.model.pricePerHour ? `${formatMoney(selection.model.pricePerHour)} ₽ / час` : 'Цена по запросу' }}</p>
                <p v-if="selection.model.pricePerShift && selection.model.pricePerHour" class="mb-0 mt-2 text-sm text-fog">{{ formatMoney(selection.model.pricePerHour) }} ₽ / час</p>
                <div class="mt-6 flex flex-col items-stretch gap-3">
                  <SiteButton href="#zayavka" tone="light" :data-equipment-type-slug="selection.model.typeSlug" :data-equipment-model-id="selection.model.id" :data-equipment-label="`${selection.model.brand} ${selection.model.model}`">Заказать эту технику</SiteButton>
                  <SiteButton :to="modelPath(selection.model.typeSlug, selection.model.slug)" tone="light" variant="ghost">Перейти на страницу</SiteButton>
                </div>
              </div>
            </div>
            <div class="mt-10 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" role="group" :aria-label="`Модели: ${selection.type?.name}`">
              <button v-for="model in selection.models" :key="model.id" type="button" :data-service-model="model.id" :aria-pressed="selection.model.id === model.id" class="flex min-w-0 flex-col overflow-hidden rounded-card border bg-white text-left text-ink transition-colors hover:border-flame focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame motion-reduce:transition-none" :class="selection.model.id === model.id ? 'border-flame ring-2 ring-flame' : 'border-white/20'" @click="selectedModel = model.id">
                <img v-if="model.photo" :src="model.photo" alt="" width="320" height="240" loading="lazy" class="aspect-[4/3] w-full object-cover">
                <span v-else class="grid aspect-[4/3] w-full place-items-center bg-cement2 p-3 text-sm">Фото уточняйте</span>
                <span class="px-3 pt-3 text-sm font-semibold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
                <span class="mt-auto px-3 pb-4 pt-2 text-sm">{{ model.pricePerShift ? `${formatMoney(model.pricePerShift)} ₽ / смена` : model.pricePerHour ? `${formatMoney(model.pricePerHour)} ₽ / час` : 'Цена по запросу' }}</span>
              </button>
            </div>
          </article>
          <div v-else class="rounded-card border border-mist p-6 md:p-8" role="status">
            <h3 class="mb-4 text-2xl font-semibold">Уточним доступную технику</h3>
            <p class="mb-6 text-fog">В этом виде пока нет опубликованных моделей. Расскажите о задаче — обсудим варианты подбора.</p>
            <SiteButton href="#zayavka" tone="light" :data-equipment-type-slug="selection.type?.slug" :data-equipment-label="selection.type?.name">Обсудить задачу</SiteButton>
          </div>
        </div>
      </div>
      <p v-if="priceDisclaimer" class="mb-0 mt-10 text-sm leading-relaxed text-fog">{{ priceDisclaimer }}</p>
    </div>
  </section>
</template>