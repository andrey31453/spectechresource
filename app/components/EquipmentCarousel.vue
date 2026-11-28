<script setup lang="ts" generic="T">
import { imageVariantUrl } from "#shared/utils/uploads";
import { NuxtLink } from "#components";
import { modelPage } from "~/utils/model-showcase";

const props = defineProps<{
  items: T[];
  itemKey: (item: T) => string;
  image: (item: T) => string | null;
  title: (item: T) => string;
  href?: (item: T) => string;
  selectedKey?: string;
  label: string;
  dark?: boolean;
}>();
const emit = defineEmits<{ select: [item: T] }>();
defineSlots<{ content(props: { item: T }): unknown }>();

const id = useId();
const page = ref(0);
const pageSize = ref(2);
const direction = ref<"next" | "previous">("next");
const transitioning = ref(false);
const pagination = computed(() => modelPage(props.items, page.value, pageSize.value));
const itemKeys = computed(() => props.items.map(props.itemKey).join("\n"));
let removeMediaListeners: (() => void) | undefined;

watch(itemKeys, () => { page.value = 0; });
onMounted(() => {
  const desktop = window.matchMedia("(min-width: 1280px)");
  const tablet = window.matchMedia("(min-width: 768px)");
  const update = () => {
    pageSize.value = desktop.matches ? 4 : tablet.matches ? 3 : 2;
    page.value = 0;
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

function changePage(target: number) {
  const next = modelPage(props.items, target, pageSize.value).index;
  if (transitioning.value || next === pagination.value.index) return;
  direction.value = next > pagination.value.index ? "next" : "previous";
  page.value = next;
}

function disableLeavingPage(element: Element) {
  element.setAttribute("inert", "");
  element.setAttribute("aria-hidden", "true");
}
</script>

<template>
  <div v-if="items.length" data-equipment-carousel class="min-w-0" :class="dark ? 'text-snow' : ''">
    <div :id="id" class="grid! min-w-0 overflow-hidden p-1 -mx-1" aria-live="polite" aria-atomic="true">
      <Transition
        enter-active-class="transition-transform duration-350 ease-in-out motion-reduce:transition-none!"
        leave-active-class="pointer-events-none transition-transform duration-350 ease-in-out motion-reduce:transition-none!"
        :enter-from-class="direction === 'previous' ? '-translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!' : 'translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!'"
        :leave-to-class="direction === 'previous' ? 'translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!' : '-translate-x-[calc(100%+1rem)] motion-reduce:translate-x-0!'"
        @before-enter="transitioning = true"
        @after-enter="transitioning = false"
        @enter-cancelled="transitioning = false"
        @before-leave="disableLeavingPage"
      >
        <div :key="`${pageSize}-${pagination.index}-${itemKeys}`" data-carousel-page class="grid! min-w-0 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 [grid-area:1/1]" role="group" :aria-label="label">
          <article v-for="item in pagination.models" :key="itemKey(item)" class="flex min-w-0 overflow-hidden rounded-card border" :class="dark ? 'border-line2 bg-panel bg-[radial-gradient(ellipse_at_top_right,rgba(255,144,30,.06),transparent_65%)] text-snow' : 'border-line bg-white text-ink'" :data-type-slug="href ? itemKey(item) : undefined">
            <component
              :is="href ? NuxtLink : 'button'"
              :to="href?.(item)" :type="href ? undefined : 'button'"
              :aria-pressed="href ? undefined : selectedKey === itemKey(item)"
              :data-service-model="href ? undefined : itemKey(item)"
              class="group flex w-full min-w-0 flex-col p-0 text-left no-underline! focus-visible:outline-2 focus-visible:-outline-offset-4"
              :class="dark ? ['text-snow! hover:bg-flame/5 focus-visible:outline-flame', selectedKey === itemKey(item) ? 'ring-2 ring-inset ring-flame' : ''] : 'text-ink! focus-visible:outline-ink'"
              @click="emit('select', item)"
            >
              <span class="grid! aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden" :class="dark ? 'bg-void/40' : 'bg-cement text-steel'">
                <img v-if="image(item)" :src="imageVariantUrl(image(item)!, 'small')" :alt="title(item)" width="480" height="300" loading="lazy" class="h-full w-full" :class="dark ? 'object-contain' : 'object-cover'">
                <span v-else class="p-5 text-center text-sm">Фото уточняйте у менеджера</span>
              </span>
              <slot name="content" :item="item" />
            </component>
          </article>
        </div>
      </Transition>
    </div>
    <nav v-if="pagination.count > 1" class="mt-8 flex flex-wrap items-center justify-center gap-3" :aria-label="`Страницы: ${label}`">
      <button type="button" aria-label="Предыдущая страница" :aria-controls="id" :disabled="pagination.index === 0" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="changePage(pagination.index - 1)">←</button>
      <div class="flex flex-wrap justify-center" role="group" aria-label="Выбор страницы">
        <button v-for="number in pagination.count" :key="number" type="button" :aria-label="`Страница ${number} из ${pagination.count}`" :aria-controls="id" :aria-current="pagination.index === number - 1 ? 'page' : undefined" class="group grid! size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" @click="changePage(number - 1)">
          <span aria-hidden="true" class="size-2.5 rounded-full bg-current" :class="pagination.index === number - 1 ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'" />
        </button>
      </div>
      <button type="button" aria-label="Следующая страница" :aria-controls="id" :disabled="pagination.index === pagination.count - 1" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="changePage(pagination.index + 1)">→</button>
    </nav>
  </div>
</template>