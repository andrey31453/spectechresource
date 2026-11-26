export interface LeadSourceContext {
  pageUrl?: string;
  pageTitle?: string;
  sourceLabel?: string;
  sourceButton?: string;
  equipmentTypeSlug?: string;
  equipmentModelId?: string;
  equipmentLabel?: string;
}

/** Карточка важнее страницы; значения не зависят от предыдущего открытия. */
export function buildLeadSource(page: LeadSourceContext, trigger: LeadSourceContext = {}): LeadSourceContext {
  const context = { ...page, ...trigger };
  const label = context.equipmentLabel?.trim();
  return {
    ...context,
    sourceLabel: context.equipmentModelId && label
      ? `Товар: ${label}`
      : context.equipmentTypeSlug && label
        ? `Категория: ${label}`
        : context.sourceLabel,
  };
}

export function readLeadPageContext(): LeadSourceContext {
  if (typeof document === "undefined") return {};
  const page = document.querySelector<HTMLElement>("[data-lead-page]");
  return buildLeadSource({
    pageUrl: window.location.href,
    pageTitle: document.title,
    sourceLabel: window.location.pathname === "/"
      ? "Главная страница"
      : document.querySelector("h1")?.textContent?.trim() || document.title,
    equipmentTypeSlug: page?.dataset.equipmentTypeSlug || undefined,
    equipmentModelId: page?.dataset.equipmentModelId || undefined,
    equipmentLabel: page?.dataset.equipmentLabel || undefined,
  });
}