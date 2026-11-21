#!/usr/bin/env node
/**
 * Аудит вёрстки числами — «глаза» для модели без входа изображений.
 *
 * Поднимает headless Chrome по CDP, открывает страницу на заданных ширинах и печатает
 * отчёт: переполнение по горизонтали, битые картинки, тап-таргеты меньше 44 px,
 * пары текст/фон с контрастом ниже нормы WCAG AA, набор кеглей, ошибки консоли.
 * Скриншоты не нужны: всё, что видно на картинке, здесь выражено числом.
 *
 *   npm run audit:visual -- --url=http://127.0.0.1:3001/ --widths=375,768,1280
 *
 * Флаги:
 *   --url=<адрес>       что открывать (по умолчанию http://127.0.0.1:3000/)
 *   --widths=<список>   ширины вьюпорта через запятую (по умолчанию 375,768,1280)
 *   --height=<px>       высота вьюпорта (по умолчанию 900)
 *   --port=<порт>       порт DevTools (по умолчанию 9333)
 *   --json              напечатать сырой JSON вместо отчёта
 *   --strict            выйти с кодом 1, если есть переполнение, битые фото или ошибки
 *
 * Chrome ищется в CHROME_PATH, иначе в стандартном месте macOS. Сервер должен быть
 * уже запущен: `npm run build && node --env-file=.env .output/server/index.mjs`.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const url = args.url ?? "http://127.0.0.1:3000/";
const widths = String(args.widths ?? "375,768,1280")
  .split(",")
  .map(Number)
  .filter((width) => Number.isFinite(width) && width > 0);
const height = Number(args.height ?? 900);
const port = Number(args.port ?? 9333);
/** Селектор области проверки: по умолчанию вся страница, можно ограничить одним блоком. */
const scope = args.scope ?? "body";
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const result = {};

  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    result[key] = value ?? "true";
  }

  return result;
}

/** Ждём, пока Chrome поднимет DevTools-эндпоинт. */
async function devtoolsUrl(port) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);

      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch {
      // Chrome ещё не слушает порт — это нормально на первых попытках.
    }

    await sleep(250);
  }

  throw new Error(`Chrome не поднял DevTools на порту ${port} — проверьте CHROME_PATH`);
}

/** Минимальный клиент CDP: запросы по id и подписка на события. */
class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.lastId = 0;
    this.pending = new Map();
    this.listeners = new Set();

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);

        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);

        return;
      }

      for (const listener of this.listeners) listener(message);
    });
  }

  static async connect(endpoint) {
    const socket = new WebSocket(endpoint);

    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    return new Cdp(socket);
  }

  send(method, params = {}, sessionId) {
    const id = (this.lastId += 1);

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(
        JSON.stringify({ id, method, params, ...(sessionId === undefined ? {} : { sessionId }) }),
      );
    });
  }

  on(listener) {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }
}

/**
 * Выражение выполняется в странице. Никаких скриншотов: только числа.
 * Внутри нельзя использовать `${...}` — шаблонная строка развернулась бы в Node.
 */
const MEASURE = `(() => {
  const SCOPE = window.__auditScope || document.body;
  const all = (selector) => Array.from(SCOPE.querySelectorAll(selector));
  const numbers = (input) => {
    const parts = String(input).match(/[\\d.]+/g);
    return parts ? parts.map(Number) : null;
  };
  const luminance = (channels) => {
    const weights = [0.2126, 0.7152, 0.0722];
    return channels.reduce((sum, value, index) => {
      const channel = value / 255;
      const linear = channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      return sum + linear * weights[index];
    }, 0);
  };
  const background = (element) => {
    let node = element;
    while (node) {
      const style = getComputedStyle(node);
      // Градиент или фото под текстом: фактический фон неизвестен, пара не проверяется.
      if (style.backgroundImage !== "none") return null;
      const channels = numbers(style.backgroundColor);
      if (channels && (channels.length === 3 || channels[3] > 0.5)) return channels.slice(0, 3);
      node = node.parentElement;
    }
    return [255, 255, 255];
  };
  const visible = (rect, style) =>
    rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";

  const variants = ["a", "b", "c", "d"].map((key) => {
    const root = document.querySelector("#modeli-variant-" + key);
    const rect = root ? root.getBoundingClientRect() : null;
    return {
      key,
      cards: root ? root.querySelectorAll('a[href*="/arenda-"]').length : 0,
      height: rect ? Math.round(rect.height) : 0,
    };
  });

  const overflow = [];
  for (const element of all("*")) {
    const rect = element.getBoundingClientRect();
    if (!visible(rect, getComputedStyle(element))) continue;
    if (rect.right <= window.innerWidth + 1 && rect.left >= -1) continue;
    let node = element.parentElement;
    let rail = false;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (["auto", "scroll"].includes(style.overflowX)) {
        rail = true;
        break;
      }
      node = node.parentElement;
    }
    overflow.push({
      tag: element.tagName.toLowerCase(),
      cls: String(element.className || "").slice(0, 48),
      right: Math.round(rect.right),
      rail,
    });
  }
  // Сортируем по правому краю: самые дальние элементы — источник переполнения.
  // rail === true значит «внутри ленты и обрезается ею» — такие строки не дефект.
  overflow.sort((left, right) => right.right - left.right);
  overflow.splice(6);

  const images = all("img");
  const broken = images.filter((image) => image.complete && image.naturalWidth === 0);

  const targets = [];
  const compact = [];
  for (const element of all("a, button, input, select, textarea, [role=tab]")) {
    const rect = element.getBoundingClientRect();
    if (!visible(rect, getComputedStyle(element))) continue;
    const item = {
      text: String(element.textContent || element.tagName).trim().slice(0, 28),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    };
    // 24 px — порог WCAG 2.5.8 (AA); 44 px — рекомендация для тач-целей.
    // Сравниваем округлённые значения: 23.98 px в отчёте читается как 24.
    if (item.w < 24 || item.h < 24) targets.push(item);
    else if (item.w < 44 || item.h < 44) compact.push(item);
    if (targets.length >= 8) break;
  }

  const contrast = [];
  for (const element of all("p, li, span, b, strong, dd, dt, h1, h2, h3, h4, a, button")) {
    // Декоративные подписи скрыты от скринридера — их контраст не нормируется.
    if (element.closest('[aria-hidden="true"]')) continue;
    const own = Array.from(element.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent.trim())
      .join(" ");
    if (!own) continue;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (!visible(rect, style)) continue;
    // Визуально скрытые подписи для скринридера (1×1 px) контраст не нормируют.
    if (rect.width < 2 || rect.height < 2) continue;
    if (Number(style.opacity) < 0.5) continue;
    const foreground = numbers(style.color);
    if (!foreground) continue;
    const back = background(element);
    if (!back) continue;
    const front = luminance(foreground.slice(0, 3));
    const backLum = luminance(back);
    const ratio = (Math.max(front, backLum) + 0.05) / (Math.min(front, backLum) + 0.05);
    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 600;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio >= need) continue;
    contrast.push({
      text: own.slice(0, 26),
      cls: String(element.className || "").slice(0, 34),
      ratio: Math.round(ratio * 100) / 100,
      size: Math.round(size),
      need,
    });
  }
  contrast.sort((left, right) => left.ratio - right.ratio);

  const fontSizes = Array.from(new Set(all("*").map((node) => getComputedStyle(node).fontSize)));
  const headings = all("h1, h2, h3").length;

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    },
    variants,
    headings,
    overflow,
    images: { total: images.length, broken: broken.length, sample: broken.slice(0, 3).map((image) => image.getAttribute("src")) },
    targets,
    compact,
    contrast: { failed: contrast.length, worst: contrast.slice(0, 60) },
    fontSizes,
  };
})()`;

const profile = await mkdtemp(join(tmpdir(), "design-audit-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--mute-audio",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const reports = [];
let cdp;

try {
  cdp = await Cdp.connect(await devtoolsUrl(port));

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  const consoleErrors = [];
  cdp.on((message) => {
    if (message.sessionId !== sessionId) return;

    if (message.method === "Runtime.exceptionThrown") {
      const text = message.params.exceptionDetails.exception?.description ?? "исключение";
      consoleErrors.push(String(text).split("\n")[0].slice(0, 160));
    }

    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      const text = message.params.args
        .map((arg) => arg.value ?? arg.description ?? "")
        .join(" ")
        .slice(0, 160);
      consoleErrors.push(text);
    }
  });

  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  for (const width of widths) {
    consoleErrors.length = 0;

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: width < 768 },
      sessionId,
    );
    await cdp.send("Page.navigate", { url }, sessionId);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      await sleep(150);
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression: "document.readyState", returnByValue: true },
        sessionId,
      );

      if (result.value === "complete") break;
    }

    // Гидрация и появление блоков идут после load: даём им время.
    await sleep(800);

    // Ленивые фото грузятся при прокрутке — прогреваем всю страницу.
    await cdp.send(
      "Runtime.evaluate",
      { expression: "window.scrollTo(0, document.body.scrollHeight)" },
      sessionId,
    );
    await sleep(700);
    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" }, sessionId);
    await sleep(400);

    await cdp.send(
      "Runtime.evaluate",
      {
        expression:
          "window.__auditScope = document.querySelector(" + JSON.stringify(scope) + ") || document.body;",
      },
      sessionId,
    );

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: MEASURE, returnByValue: true },
      sessionId,
    );

    reports.push({ width, ...result.value, consoleErrors: [...consoleErrors] });
  }
} finally {
  if (cdp) await cdp.send("Browser.close").catch(() => undefined);
  chrome.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}

if (args.json === "true") {
  console.log(JSON.stringify(reports, null, 2));
} else {
  let problems = 0;

  for (const report of reports) {
    const lines = [];
    const variants = report.variants
      .map((variant) => `${variant.key.toUpperCase()}: ${variant.cards} карт. / ${variant.height} px`)
      .join(" · ");

    lines.push(
      `${report.width}×${height} · документ ${report.document.width}×${Math.round(report.document.height)} px${scope === "body" ? "" : ` · область ${scope}`}`,
    );
    lines.push(`  версии блока: ${variants}`);

    if (report.document.width > report.width + 1) {
      problems += 1;
      lines.push(`  ✗ переполнение по горизонтали: ${report.document.width} > ${report.width}`);
    } else {
      lines.push("  ✓ переполнения по горизонтали нет");
    }

    const escaped = report.overflow.filter((item) => !item.rail);

    if (escaped.length) {
      problems += 1;
      for (const item of escaped) {
        lines.push(`  ✗ за краем: <${item.tag}> ${item.cls} (правый край ${item.right})`);
      }
    }

    if (report.images.broken > 0) {
      problems += 1;
      lines.push(`  ✗ битых фото: ${report.images.broken} из ${report.images.total}`);
      for (const source of report.images.sample) lines.push(`      ${source}`);
    } else {
      lines.push(`  ✓ фото: ${report.images.total}, битых нет`);
    }

    if (report.targets.length) {
      problems += 1;
      lines.push(`  ✗ кликабельное меньше 24 px (WCAG 2.5.8): ${report.targets.length}`);
      for (const target of report.targets.slice(0, 4)) {
        lines.push(`      «${target.text}» ${target.w}×${target.h}`);
      }
    } else {
      lines.push("  ✓ кликабельные цели: все ≥ 24 px");
    }

    if (report.compact?.length) {
      lines.push(`  · компактные цели 24–43 px (норма для десктопа): ${report.compact.length}`);
    }

    if (report.contrast.failed) {
      lines.push(`  · контраст ниже AA: ${report.contrast.failed} пар, худшие:`);
      for (const item of report.contrast.worst.slice(0, 4)) {
        const where = item.cls ? ` [${item.cls}]` : "";
        lines.push(`      ${item.ratio}:1 (нужно ${item.need}) ${item.size}px «${item.text}»${where}`);
      }
    } else {
      lines.push("  ✓ контраст текста: все пары проходят AA");
    }

    lines.push(
      `  · кеглей: ${report.fontSizes.length} · заголовков h1–h3: ${report.headings} · ошибок консоли: ${report.consoleErrors.length}`,
    );
    for (const error of report.consoleErrors.slice(0, 3)) lines.push(`      ${error}`);

    if (report.consoleErrors.length) problems += 1;

    console.log(lines.join("\n"));
    console.log("");
  }

  if (args.strict === "true" && problems > 0) process.exitCode = 1;
}


