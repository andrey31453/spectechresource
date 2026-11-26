<script setup lang="ts">
import { nextTick, onBeforeUnmount, watch } from "vue";

const props = defineProps<{ open: boolean; context: import("~/composables/useLeadDrawer").LeadDrawerContext; phone?: string | null }>();
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
const previousFocus = ref<HTMLElement | null>(null);
let previousOverflow = "";

function close() {
  emit("close");
}

function restoreFocus() {
  previousFocus.value?.focus({ preventScroll: true });
  previousFocus.value = null;
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab" || !panel.value) return;
  const focusable = [...panel.value.querySelectorAll<HTMLElement>("a, button, input, textarea, select, [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0 && element.tabIndex >= 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.open, async (open) => {
  if (import.meta.server) return;
  if (open) {
    previousFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    panel.value?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
  }
}, { flush: "sync" });

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  if (props.open) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-500 motion-reduce:transition-none" leave-active-class="transition-opacity duration-500 motion-reduce:transition-none" enter-from-class="opacity-0 [&_aside]:translate-x-full" leave-to-class="opacity-0 [&_aside]:translate-x-full" @after-leave="restoreFocus">
    <div v-if="open" class="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="lead-drawer-title">
      <div aria-hidden="true" class="absolute inset-0 bg-ink/35 backdrop-blur-[3px]" @click="close" />
      <aside ref="panel" class="absolute top-0 right-0 flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-sand p-5 text-ink shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none sm:p-8">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <p class="m-0 text-xs font-bold tracking-[.18em] text-ember-ink uppercase">Заявка</p>
            <h2 id="lead-drawer-title" class="mt-2 mb-0 text-2xl font-extrabold">Подберём технику</h2>
          </div>
          <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full border border-cement-line text-2xl leading-none hover:border-ember-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-ink" aria-label="Закрыть форму" @click="close">×</button>
        </div>
        <p v-if="context.equipmentLabel" class="mb-5 rounded-field bg-flame/15 px-3 py-2 text-sm font-semibold">Техника: {{ context.equipmentLabel }}</p>
        <LeadForm
          :key="`${context.equipmentTypeSlug ?? ''}:${context.equipmentModelId ?? ''}`"
          :place="context.equipmentTypeSlug || context.equipmentModelId ? 'equipment' : 'callback'"
          :equipment-type-slug="context.equipmentTypeSlug"
          :equipment-model-id="context.equipmentModelId"
          :source="context"
          :phone="phone"
          heading="Оставьте контакты"
          lead="Достаточно телефона или e-mail — остальное уточним при звонке."
          submit-label="Отправить заявку"
          class="border-0! bg-transparent! p-0! shadow-none!"
        />
      </aside>
    </div>
    </Transition>
  </Teleport>
</template>