import type { Ref } from "vue";

export interface LeadDrawerContext {
  equipmentTypeSlug?: string;
  equipmentModelId?: string;
  equipmentLabel?: string;
}

export function useLeadDrawer(): {
  isOpen: Ref<boolean>;
  context: Ref<LeadDrawerContext>;
  open: (next?: LeadDrawerContext) => void;
  close: () => void;
} {
  const isOpen = useState<boolean>("lead-drawer-open", () => false);
  const context = useState<LeadDrawerContext>("lead-drawer-context", () => ({}));
  function open(next: LeadDrawerContext = {}) {
    context.value = { ...next };
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return { isOpen, context, open, close };
}