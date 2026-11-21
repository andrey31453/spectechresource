/**
 * Арифметика горизонтальных лент карточек.
 *
 * Блок «Каталог моделей» существует в нескольких версиях (см. `model-variants.ts`),
 * и листаться они должны одинаково: одна карточка — один шаг, страница — столько
 * карточек, сколько видно целиком. Геометрия считается по DOM (ширина карточки
 * задана утилитами Tailwind), поэтому вся математика вынесена в чистые функции:
 * их проверяют тесты, а композабл `useModelRail` только читает DOM и вызывает их.
 */

/** Что нужно знать о ленте, чтобы посчитать страницы. */
export interface RailMetricsInput {
  /** Сколько карточек в ленте. */
  count: number;
  /** Ширина одной карточки, px. */
  cardWidth: number;
  /** Зазор между карточками (`column-gap`), px. */
  gap: number;
  /** Видимая ширина ленты, px. */
  clientWidth: number;
  /** Полная ширина содержимого ленты, px. */
  scrollWidth: number;
}

export interface RailMetrics {
  /** Шаг карточки: ширина + зазор. */
  step: number;
  /** Сколько карточек влезает в кадр целиком, минимум одна. */
  inView: number;
  /** Ширина страницы листания — целыми карточками. */
  pageWidth: number;
  /** Всего страниц; при неразмеченной ленте — одна. */
  pages: number;
  /** Насколько лента прокручиваема: `scrollWidth - clientWidth`. */
  max: number;
}

/**
 * Метрики ленты.
 *
 * `inView` считается через `floor`, а не `round`: при карточке 300 px и зазоре 16 px
 * в кадр 1240 px влезают три карточки (4 × 300 + 3 × 16 = 1248 > 1240), и округление
 * вверх дало бы страницу шире кадра — часть карточки уезжала бы за край.
 * Если ширины ещё не измерены (SSR, скрытая секция), лента считается одной страницей:
 * точки и стрелки до первого замера не рисуются.
 */
export function railMetrics({
  count,
  cardWidth,
  gap,
  clientWidth,
  scrollWidth,
}: RailMetricsInput): RailMetrics {
  const step = cardWidth + gap;
  const max = Math.max(0, scrollWidth - clientWidth);

  if (step <= 0 || count <= 0) {
    return { step: 0, inView: 1, pageWidth: clientWidth, pages: 1, max };
  }

  const inView = Math.max(1, Math.floor((clientWidth + gap) / step));

  return {
    step,
    inView,
    pageWidth: step * inView,
    pages: Math.max(1, Math.ceil(count / inView)),
    max,
  };
}

/**
 * Текущая страница по позиции прокрутки. Последняя страница прижимается к правому
 * краю (её `scrollLeft` не равен `page × pageWidth`), поэтому определяется по `max`.
 */
export function railPage(scrollLeft: number, metrics: RailMetrics): number {
  const last = metrics.pages - 1;

  if (metrics.max > 0 && scrollLeft >= metrics.max - 2) return last;
  if (metrics.pageWidth <= 0) return 0;

  return Math.min(last, Math.max(0, Math.round(scrollLeft / metrics.pageWidth)));
}

/** Куда прокрутить при шаге стрелкой: в границах ленты, шаг — одна страница. */
export function railTargetPage(current: number, direction: -1 | 1, metrics: RailMetrics): number {
  return Math.min(metrics.pages - 1, Math.max(0, current + direction));
}
