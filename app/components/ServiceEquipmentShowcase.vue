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

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame";
</script>

<template>
  <section v-if="equipment.types.length" id="service-equipment" class="bg-night text-snow" aria-labelledby="service-equipment-title">
    <div class="mx-auto max-w-site px-5 py-16 md:px-8 md:py-24">
      <p class="mb-4 font-mono text-xs uppercase tracking-widest text-flame2">Техника для вашей задачи</p>
      <h2 id="service-equipment-title" class="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">Выберите машину для работ</h2>
      <div class="grid min-w-0 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <div class="flex min-w-0 flex-wrap content-start gap-1 self-start lg:flex-col lg:items-start" role="group" aria-label="Виды техники для услуги">
          <button
            v-for="type in equipment.types" :key="type.slug" type="button"
            :aria-pressed="selection.type?.slug === type.slug" :data-service-type="type.slug"
            :class="[focus, selection.type?.slug === type.slug ? 'text-flame2 bg-flame/10' : 'text-mist']"
            class="min-h-11 rounded-field border-0 px-2 py-2 text-left text-sm font-semibold transition-colors hover:bg-flame/10 hover:text-flame2 motion-reduce:transition-none"
            @click="chooseType(type.slug)"
          >{{ type.name }}</button>
        </div>
        <div class="min-w-0">
          <Transition mode="out-in" enter-active-class="transition-opacity duration-300 motion-reduce:transition-none!" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150 motion-reduce:transition-none!" leave-to-class="opacity-0">
            <article v-if="selection.model" :key="selection.model.id" data-service-selected :data-model-id="selection.model.id" class="min-w-0 self-start rounded-card bg-panel bg-[radial-gradient(ellipse_at_top_right,rgba(255,144,30,.07),transparent_65%)] p-5 md:p-7">
              <h3 class="mb-5 text-2xl font-semibold leading-tight [overflow-wrap:anywhere] md:text-3xl">{{ selection.model.brand }} {{ selection.model.model }}</h3>
              <div class="grid min-w-0 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div class="min-w-0 overflow-hidden rounded-field bg-void/40">
                  <img v-if="selection.model.photo" :src="selection.model.photo" :alt="`${selection.model.brand} ${selection.model.model}`" width="640" height="420" loading="lazy" class="aspect-[3/2] max-h-56 w-full object-contain">
                  <p v-else class="m-0 grid aspect-[3/2] place-items-center px-4 text-sm text-fog">Фото уточняйте при заказе</p>
                </div>
                <div class="min-w-0">
                  <p class="mb-2 text-xs uppercase tracking-widest text-fog">Стоимость аренды</p>
                  <p class="mb-0 text-xl font-semibold">{{ selection.model.pricePerShift ? `${formatMoney(selection.model.pricePerShift)} ₽ / смена` : selection.model.pricePerHour ? `${formatMoney(selection.model.pricePerHour)} ₽ / час` : 'Цена по запросу' }}</p>
                  <p v-if="selection.model.pricePerShift && selection.model.pricePerHour" class="mb-0 mt-2 text-sm text-fog">{{ formatMoney(selection.model.pricePerHour) }} ₽ / час</p>
                  <div class="mt-5 flex flex-wrap gap-3">
                    <SiteButton :to="modelPath(selection.model.typeSlug, selection.model.slug)" tone="light" variant="ghost">Посмотреть</SiteButton>
                    <SiteButton href="#zayavka" tone="light" :data-equipment-type-slug="selection.model.typeSlug" :data-equipment-model-id="selection.model.id" :data-equipment-label="`${selection.model.brand} ${selection.model.model}`">Заказать</SiteButton>
                  </div>
                </div>
              </div>
              <div class="mt-6 pt-5">
                <h4 class="mb-4 text-sm font-semibold text-fog">Характеристики</h4>
                <div v-if="selection.model.specs.length" data-service-specs tabindex="0" role="region" aria-label="Характеристики выбранной техники" :class="focus" class="max-h-[11rem] overflow-y-auto overscroll-contain rounded-field pr-4">
                  <ModelSpecs :specs="selection.model.specs" class="m-0" />
                </div>
                <p v-else class="m-0 text-sm text-fog">Характеристики уточняйте при заказе.</p>
              </div>
            </article>
            <div v-else :key="selection.type?.slug" class="min-w-0 self-start rounded-card bg-panel p-6 md:p-8" role="status">
              <h3 class="mb-4 text-2xl font-semibold">Уточним доступную технику</h3>
              <p class="mb-6 text-fog">В этом виде пока нет опубликованных моделей. Расскажите о задаче — обсудим варианты подбора.</p>
              <SiteButton href="#zayavka" tone="light" :data-equipment-type-slug="selection.type?.slug" :data-equipment-label="selection.type?.name">Обсудить задачу</SiteButton>
            </div>
          </Transition>
        </div>
      </div>

      <EquipmentCarousel
        class="mt-10" dark :items="selection.models" :item-key="model => model.id"
        :image="model => model.photo" :title="model => `${model.brand} ${model.model}`"
        :selected-key="selection.model?.id" :label="`Модели: ${selection.type?.name ?? ''}`"
        @select="selectedModel = $event.id"
      >
        <template #content="{ item: model }">
          <span class="px-4 pt-4 text-sm font-semibold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
          <span class="mt-auto px-4 pb-4 pt-2 text-sm text-fog">{{ model.pricePerShift ? `${formatMoney(model.pricePerShift)} ₽ / смена` : model.pricePerHour ? `${formatMoney(model.pricePerHour)} ₽ / час` : 'Цена по запросу' }}</span>
        </template>
      </EquipmentCarousel>
      <p v-if="priceDisclaimer" class="mb-0 mt-8 text-sm leading-relaxed text-fog">{{ priceDisclaimer }}</p>
    </div>
  </section>
</template>
