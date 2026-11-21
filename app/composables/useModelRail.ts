import { onBeforeUnmount, onMounted, ref } from "vue";
import { railMetrics, railPage, railTargetPage, type RailMetrics } from "~/utils/rail";

/** Состояние одной ленты: текущая страница с нуля и сколько их всего. */
export interface ModelRailState {
  page: number;
  pages: number;
}

/**
 * Ленты карточек блока «Каталог моделей».
 *
 * Версий блока четыре, и каждая держит свою ленту: если бы состояние жило на странице
 * под общим ключом `category.slug`, стрелки одного варианта двигали бы чужие ряды —
 * якоря разделов у вариантов одинаковые. Поэтому композабл вызывается в каждом
 * компоненте и хранит ссылки в собственной области видимости.
 *
 * Страница считается целыми карточками по фактической ширине DOM (см. `rail.ts`),
 * прокрутка — `scrollTo`; при `prefers-reduced-motion` без плавности. Состояние
 * пишется только при реальном изменении: ref-функция ленты вызывается на каждом
 * патче, и лишняя запись запустила бы бесконечный перерендер.
 */
export function useModelRail() {
  const nodes = new Map<string, HTMLElement>();
  const states = ref<Record<string, ModelRailState>>({});

  function measure(node: HTMLElement): RailMetrics {
    const cards = node.querySelectorAll<HTMLElement>("li");

    return railMetrics({
      count: cards.length,
      cardWidth: cards[0]?.offsetWidth ?? 0,
      gap: Number.parseFloat(getComputedStyle(node).columnGap) || 0,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    });
  }

  /** Пересчитывает страницы ленты и её текущую позицию. */
  function update(key: string) {
    const node = nodes.get(key);
    if (!node) return;

    const metrics = measure(node);
    const page = railPage(node.scrollLeft, metrics);
    const current = states.value[key];

    if (current && current.page === page && current.pages === metrics.pages) return;

    states.value[key] = { page, pages: metrics.pages };
  }

  /** `:ref` ленты: запоминает узел и сразу считает метрики. */
  function setRail(key: string, el: unknown) {
    const node = el instanceof HTMLElement ? el : null;

    if (!node) {
      nodes.delete(key);
      return;
    }

    nodes.set(key, node);
    update(key);
  }

  function railPageOf(key: string): number {
    return states.value[key]?.page ?? 0;
  }

  function railPagesOf(key: string): number {
    return states.value[key]?.pages ?? 1;
  }

  /** Переход на страницу: последнюю прижимаем к правому краю, чтобы кадр остался полным. */
  function goToPage(key: string, target: number) {
    const node = nodes.get(key);
    if (!node) return;

    const metrics = measure(node);
    const page = Math.min(metrics.pages - 1, Math.max(0, target));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    node.scrollTo({
      left: Math.min(page * metrics.pageWidth, metrics.max),
      behavior: reduced ? "auto" : "smooth",
    });
  }

  /** Стрелка листает ровно одну страницу — столько карточек, сколько видно целиком. */
  function scrollRail(key: string, direction: -1 | 1) {
    const node = nodes.get(key);
    if (!node) return;

    goToPage(key, railTargetPage(railPageOf(key), direction, measure(node)));
  }

  function updateAll() {
    for (const key of nodes.keys()) update(key);
  }

  onMounted(() => {
    updateAll();
    window.addEventListener("resize", updateAll, { passive: true });
  });
  onBeforeUnmount(() => {
    window.removeEventListener("resize", updateAll);
    nodes.clear();
  });

  return { setRail, update, goToPage, scrollRail, railPageOf, railPagesOf, updateAll };
}
