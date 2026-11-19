/**
 * Поведение главной страницы по макету `docs/sait-13` (1:1): прогрессивное улучшение,
 * без которого разметка остаётся читаемой. Шесть модулей макета — появление блоков
 * при скролле, мобильное меню `<details>`, табы, маска телефона, проверка и отправка
 * заявки, шкала разделов у левой кромки.
 *
 * Модули ищут элементы в документе и навешивают слушатели; `initLanding` возвращает
 * функцию очистки, потому что страница монтируется повторно после SPA-переходов.
 */

/** Порог появления блоков: как в макете (`threshold: 0.08`, отступ снизу −6%). */
const REVEAL_THRESHOLD = 0.08;
const REVEAL_ROOT_MARGIN = "0px 0px -6% 0px";
/** Точка «чтения» на экране для шкалы разделов — 34% высоты окна. */
const RAIL_PROBE_RATIO = 0.34;
/** Скролл шкалы считаем не чаще, чем раз в 80 мс. */
const RAIL_SCROLL_DELAY = 80;
/** С этой ширины мобильное меню закрывается: на десктопе оно скрыто. */
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Маска телефона из макета: `8` приводится к `7`, первая цифра — код страны.
 * Возвращает `+7 (999) 123-45-67` по мере ввода; пустая строка остаётся пустой.
 */
export function formatPhoneInput(value: string): string {
  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  if (digits[0] === "8") digits = `7${digits.slice(1)}`;
  if (digits[0] !== "7") digits = `7${digits}`;
  digits = digits.slice(0, 11);

  let result = "+7";
  if (digits.length > 1) result += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 5) result += `) ${digits.slice(4, 7)}`;
  if (digits.length >= 8) result += `-${digits.slice(7, 9)}`;
  if (digits.length >= 10) result += `-${digits.slice(9, 11)}`;

  return result;
}

export interface RailState {
  /** Верх каждой секции в координатах документа. */
  positions: number[];
  /** Линия чтения: `scrollY + innerHeight * 0.34`. */
  probe: number;
  /** Прокрутка в самом начале и в самом конце страницы. */
  atTop: boolean;
  atBottom: boolean;
}

/** Активный пункт шкалы: последняя секция, чей верх выше линии чтения. */
export function pickRailIndex({ positions, probe, atTop, atBottom }: RailState): number {
  if (!positions.length) return -1;
  if (atTop) return 0;
  if (atBottom) return positions.length - 1;

  let active = 0;
  positions.forEach((top, index) => {
    if (top <= probe) active = index;
  });

  return active;
}


/** Появление блоков `.reveal`: каждая карточка получает свою задержку. */
function initReveal(): () => void {
  const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  if (!items.length) return () => {};

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
  );

  items.forEach((item, index) => {
    item.style.setProperty("--d", `${(index % 6) * 0.05}s`);
    observer.observe(item);
  });

  return () => observer.disconnect();
}

/** Мобильное меню: высота панели и закрытие по клику вне, Escape и переходу по ссылке. */
function initMobileNav(): () => void {
  const nav = document.querySelector<HTMLDetailsElement>("details.mnav");
  if (!nav) return () => {};

  const header = nav.closest<HTMLElement>(".site-header");
  const measure = () => {
    if (!header) return;
    header.style.setProperty("--mnav-top", `${Math.round(header.getBoundingClientRect().bottom)}px`);
    header.classList.add("is-mnav-measured");
  };

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (nav.open && target && !nav.contains(target)) nav.open = false;
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && nav.open) nav.open = false;
  };
  const onNavClick = (event: MouseEvent) => {
    if ((event.target as Element | null)?.closest("a")) nav.open = false;
  };
  const onResize = () => {
    measure();
    if (nav.open && window.innerWidth >= DESKTOP_MIN_WIDTH) nav.open = false;
  };

  measure();
  window.addEventListener("load", measure);
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", measure);
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
  nav.addEventListener("click", onNavClick);

  return () => {
    window.removeEventListener("load", measure);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", measure);
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
    nav.removeEventListener("click", onNavClick);
  };
}

/** Табы (материалы, нормативы, цены): `role="tab"` + панели по `aria-controls`. */
function initTabs(): () => void {
  const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-tabs]"));
  const cleanups: Array<() => void> = [];

  for (const group of groups) {
    const tabs = Array.from(group.querySelectorAll<HTMLElement>('[role="tab"]'));
    const panels = Array.from(group.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    if (!tabs.length || tabs.length !== panels.length) continue;

    const pairs: Array<{ tab: HTMLElement; panel: HTMLElement }> = [];
    let broken = false;
    for (const tab of tabs) {
      const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
      if (!panel || !group.contains(panel)) {
        broken = true;
        break;
      }
      pairs.push({ tab, panel });
    }
    if (broken) continue;

    const activate = (index: number, focus: boolean) => {
      pairs.forEach(({ tab, panel }, position) => {
        const active = position === index;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
        panel.classList.toggle("is-active", active);
      });
      if (focus) pairs[index]?.tab.focus();
    };

    const onClick = (event: Event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('[role="tab"]');
      if (!target || !group.contains(target)) return;
      const index = pairs.findIndex(({ tab }) => tab === target);
      if (index >= 0) activate(index, false);
    };

    const onKeydown = (event: KeyboardEvent) => {
      const current = pairs.findIndex(({ tab }) => tab === (event.target as HTMLElement | null));
      if (current < 0) return;

      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      let next: number | null = null;
      if (step) next = (current + step + pairs.length) % pairs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = pairs.length - 1;

      if (next === null) return;
      event.preventDefault();
      activate(next, true);
    };

    const hashIndex = pairs.findIndex(({ panel }) => `#${panel.id}` === window.location.hash);
    activate(hashIndex >= 0 ? hashIndex : 0, false);
    group.classList.add("is-tabs-ready");

    group.addEventListener("click", onClick);
    group.addEventListener("keydown", onKeydown);
    cleanups.push(() => {
      group.removeEventListener("click", onClick);
      group.removeEventListener("keydown", onKeydown);
    });
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

/** Маска телефона на всех `input[type="tel"]` страницы. */
function initPhoneMask(): () => void {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="tel"]'));
  const cleanups: Array<() => void> = [];

  for (const input of inputs) {
    const onInput = () => {
      const atEnd = input.selectionStart === input.value.length;
      const masked = formatPhoneInput(input.value);
      if (masked === input.value) return;

      input.value = masked;
      if (atEnd && typeof input.setSelectionRange === "function") {
        input.setSelectionRange(masked.length, masked.length);
      }
    };

    input.addEventListener("input", onInput);
    cleanups.push(() => input.removeEventListener("input", onInput));
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

/** Поля формы заявки, которые читает модуль; остальное тело собирает страница. */
export interface LandingLeadInput {
  name: string;
  phone: string;
  comment: string;
}

/**
 * Отправка заявки. Ошибка с непустым текстом попадёт в статус формы; пустая —
 * заменится общим текстом ошибки из `data-form-error` макета.
 */
export type LandingLeadSubmit = (input: LandingLeadInput) => Promise<void>;

export interface LandingOptions {
  /** Отправка заявки: без неё форма работает по-нативному, как в макете. */
  submitLead?: LandingLeadSubmit;
}

/**
 * Форма заявки: проверка полей и статус. Если передана отправка (`submitLead`),
 * модуль отменяет нативный submit, шлёт заявку и показывает результат; иначе
 * ведёт себя как макет — сообщает о невалидных полях и отдаёт отправку браузеру.
 */
function initForms(options: LandingOptions): () => void {
  const forms = Array.from(document.querySelectorAll<HTMLFormElement>("[data-form]"));
  const cleanups: Array<() => void> = [];

  for (const form of forms) {
    const status = form.querySelector<HTMLElement>("[data-form-status]");
    const successText = status?.textContent ?? "";
    const errorText = status?.dataset.formError ?? "";
    let pending = false;

    const showStatus = (text: string, isError: boolean) => {
      if (!status) return;
      if (text) status.textContent = text;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", isError);
    };

    const onSubmit = (event: Event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        showStatus(errorText, true);
        if (typeof form.reportValidity === "function") form.reportValidity();
        return;
      }

      if (!options.submitLead || pending) {
        if (pending) event.preventDefault();
        return;
      }

      event.preventDefault();
      const data = new FormData(form);
      const input: LandingLeadInput = {
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        comment: String(data.get("comment") ?? ""),
      };

      pending = true;
      options
        .submitLead(input)
        .then(() => {
          showStatus(successText, false);
          form.reset();
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "";
          showStatus(message || errorText, true);
        })
        .finally(() => {
          pending = false;
        });
    };

    form.addEventListener("submit", onSubmit);
    cleanups.push(() => form.removeEventListener("submit", onSubmit));
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

/** Шкала разделов у левой кромки: подсветка пункта по позиции секции. */
function initRail(): () => void {
  const rail = document.querySelector<HTMLElement>("[data-rail]");
  if (!rail) return () => {};

  const links = Array.from(rail.querySelectorAll<HTMLElement>("[data-rail-target]"));
  if (links.length < 2) return () => {};

  const found = links.map((link) => document.getElementById(link.dataset.railTarget ?? ""));
  if (found.some((section) => !section)) return () => {};
  const targets = found as HTMLElement[];

  const header = document.querySelector<HTMLElement>(".site-header");
  let positions: number[] = [];
  let active = -1;
  let timer = 0;

  const measureTop = () => {
    if (!header) return;
    const height = Math.round(header.getBoundingClientRect().height);
    if (height > 0) rail.style.setProperty("--rail-top", `${height}px`);
  };

  const measure = () => {
    measureTop();
    positions = targets.map((section) => section.getBoundingClientRect().top + window.scrollY);
  };

  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    links.forEach((link, position) => {
      const current = position === index;
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const update = () => {
    const scrollY = window.scrollY;
    const viewport = window.innerHeight || 1;
    const documentBottom = Math.max(document.documentElement.scrollHeight, scrollY + viewport);

    setActive(
      pickRailIndex({
        positions,
        probe: scrollY + viewport * RAIL_PROBE_RATIO,
        atTop: scrollY <= 1,
        atBottom: scrollY + viewport >= documentBottom - 1,
      }),
    );
  };

  const onScroll = () => {
    if (timer) return;
    timer = window.setTimeout(() => {
      timer = 0;
      update();
    }, RAIL_SCROLL_DELAY);
  };

  const onResize = () => {
    measure();
    update();
  };

  measure();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize);

  return () => {
    if (timer) window.clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("load", onResize);
  };
}

/**
 * Запуск всех модулей макета. Ошибка одного модуля не мешает остальным:
 * в консоль уходит предупреждение, страница остаётся рабочей.
 */
export function initLanding(options: LandingOptions = {}): () => void {
  const modules: Array<[string, () => () => void]> = [
    ["reveal", initReveal],
    ["mobile-nav", initMobileNav],
    ["tabs", initTabs],
    ["phone-mask", initPhoneMask],
    ["form", () => initForms(options)],
    ["rail", initRail],
  ];

  const cleanups: Array<() => void> = [];

  for (const [name, init] of modules) {
    try {
      cleanups.push(init());
    } catch (error) {
      console.warn(`[landing] модуль «${name}» не запустился`, error);
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

