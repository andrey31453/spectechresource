<template>
  <NuxtRouteAnnouncer />
  <div :inert="isOpen" class="transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none" :style="{ transform: isOpen ? 'translateX(calc(-1 * min(460px, 100vw)))' : undefined }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
  <LeadDrawer :open="isOpen" :context="context" :phone="site?.phone" @close="close" />
</template>

<script setup lang="ts">
const { isOpen, context, open, close } = useLeadDrawer();
const { data: site } = await useSite();

function onLeadLinkClick(event: MouseEvent) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.target === "_blank") return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || !["#zayavka", "#raschet", "#model-order"].includes(url.hash)) return;
  event.preventDefault();
  open({
    equipmentTypeSlug: link.dataset.equipmentTypeSlug,
    equipmentModelId: link.dataset.equipmentModelId,
    equipmentLabel: link.dataset.equipmentLabel,
  });
}

onMounted(() => {
  document.addEventListener("click", onLeadLinkClick, true);
  if (["#zayavka", "#raschet"].includes(window.location.hash)) open();
});
onBeforeUnmount(() => document.removeEventListener("click", onLeadLinkClick, true));
const route = useRoute();
watch(() => route.fullPath, close);
</script>
