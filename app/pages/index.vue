<script setup lang="ts">
import type { FetchError } from "ofetch";
import { computed, nextTick, onBeforeUnmount, onMounted } from "vue";
import { buildLeadPayload, createRequestId } from "~/utils/lead-form";
import { initLanding, type LandingLeadInput } from "~/utils/landing";

/**
 * Главная — точная копия макета `docs/sait-13` (1:1): разметка, стили и поведение
 * перенесены из `dist/index.html` без изменений. Тексты, цифры и фотографии — данные
 * макета (фортТех, защита от БПЛА), их заменяет следующий слайс наполнения.
 *
 * Стили макета — файл `/landing/style.css` (сборка референса без изменений). Он
 * подключается ссылкой из `public/`, а не импортом: импорт попадал в общий чанк
 * страниц, и `body` макета (тёмный фон, `color-scheme: dark`) применялся на всех
 * маршрутах. Порядок решает `moveStyleLast`: правила макета должны идти последними.
 * Правила каркаса, пересекающиеся с макетом (body, a, img, .lead, .grid), лежат
 * в `main.css` внутри слоёв и с меткой `landing-page` на <body>.
 */
definePageMeta({ layout: false });

const { data: site } = await useSite();
const route = useRoute();

const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");
/** Бренд без организационной формы — только для title. */
const brandName = computed(() => companyName.value.replace(/^ООО\s+/, "").replace(/[«»]/g, ""));
const city = computed(() => site.value?.city ?? { name: "Москва", nameIn: "Москве" });

usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} | ${brandName.value}`,
  description: `Аренда спецтехники в ${city.value.nameIn} и области: экскаваторы, автокраны, самосвалы, катки, сваебойные установки. Договор с юрлицами, подача от 4 часов.`,
  path: "/",
});

/** Шрифт макета и метка страницы: только на главной, при уходе со страницы теги снимаются. */
useHead({
  // Метка на <body> отключает правила каркаса, которые пересекаются с макетом:
  // переносы в заголовках (`tailwind.css`) и классы `.lead`/`.grid` (`main.css`).
  bodyAttrs: { class: "landing-page" },
  // Тёмная строка браузера на мобильном — как у макета (`--color-night` = фон body).
  meta: [{ name: "theme-color", content: "#0b0f13", key: "theme-color" }],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      key: "landing-font",
    },
    {
      rel: "stylesheet",
      href: "/landing/style.css",
      key: "landing-style",
      tagPriority: "low",
    },
  ],
});

/**
 * Ставит стили макета последними в `<head>`.
 *
 * В собранном приложении ссылка и так идёт после CSS сайта, а в dev-режиме Vite
 * вставляет `tailwind.css` и `main.css` тегами `<style>` уже после неё — и тогда
 * `body` и токены каркаса перебивают макет. Перемещение ссылки — та же таблица
 * стилей из кеша, без повторной загрузки; первый кадр рисуется по ней же.
 */
function moveStyleLast() {
  const link = document.head.querySelector<HTMLLinkElement>('link[data-hid="landing-style"]');
  if (!link || link === document.head.lastElementChild) return;
  document.head.append(link);
}

type LeadErrorPayload = {
  message?: string;
  data?: { errors?: Array<{ field: string; message: string }> };
};

/**
 * Отправка заявки главной: те же схема и API, что у остальных форм сайта
 * (ADR-5 — сначала запись в БД, потом CRM). Согласие на обработку данных в макете
 * выражено примечанием под кнопкой, поэтому уходит `consent: true`.
 */
async function submitLead(input: LandingLeadInput) {
  const payload = buildLeadPayload({
    place: "landing-form",
    name: input.name,
    phone: input.phone,
    comment: input.comment,
    consent: true,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referer: document.referrer || null,
    requestId: createRequestId(),
    query: route.query,
  });

  try {
    await $fetch("/api/leads", { method: "POST", body: payload });
  } catch (error) {
    // Текст уходит в статус формы: сообщение сервера точнее общего текста макета.
    const fetchError = error as FetchError<LeadErrorPayload>;
    throw new Error(
      fetchError.data?.data?.errors?.[0]?.message ?? fetchError.data?.message ?? "",
      { cause: error },
    );
  }
}

/** Модули макета: появление блоков, меню, табы, маска, заявка, шкала разделов. */
let disposeLanding: (() => void) | undefined;
onMounted(() => {
  void nextTick(moveStyleLast);
  disposeLanding = initLanding({ submitLead });
});
onBeforeUnmount(() => {
  disposeLanding?.();
  disposeLanding = undefined;
});
</script>

<template>
<div>
<header class="site-header">
  <div class="shell flex items-center justify-between gap-6 py-3">
    <a class="brand" href="/">
  <svg class="brand__mark" viewBox="0 0 104 137" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M0 35.5L28 17.5V129.5L0 122Z"/>
    <path fill="currentColor" d="M36 11.7L52 0L68 7.1V125.3L52 137L36 129.9Z"/>
    <path class="brand__mark-accent" d="M76 7.5L104 15V101.5L76 119.5Z"/>
  </svg>
  <span>
    <span class="brand__name">форт<span class="brand__accent">Тех</span></span>
    <span class="brand__tag">защита от БПЛА</span>
  </span>
</a>

    <nav class="hidden lg:flex items-center gap-6" aria-label="Основное меню">
      <div class="nav-group">
        <button class="nav-group__btn" type="button" aria-haspopup="true">Направления<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9.5 6 6 6-6"/></svg></button>
        <div class="nav-group__list">
          <a href="./mosty.html" >Мосты и путепроводы</a>
          <a href="./npz.html" >НПЗ, нефтебазы, АЗС</a>
          <a href="./podstancii.html" >Подстанции и ОРУ</a>
          <a href="./zdaniya.html" >Здания и склады</a>
          <a href="./okna.html" >Окна и остекление</a>
        </div>
      </div>
      <div class="nav-group">
        <button class="nav-group__btn" type="button" aria-haspopup="true">Решения и материалы<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9.5 6 6 6-6"/></svg></button>
        <div class="nav-group__list">
          <a href="./konstrukcii.html" >Конструкции и материалы</a>
          <a href="./zpb.html" >Противоосколочные блоки</a>
          <a href="./proektirovanie.html" >Проектирование и документы</a>
        </div>
      </div>
      <div class="nav-group">
        <button class="nav-group__btn" type="button" aria-haspopup="true">Расчёт и заявка<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9.5 6 6 6-6"/></svg></button>
        <div class="nav-group__list">
          <a href="./ceny.html" >Стоимость</a>
          <a href="./kontakty.html" >Контакты и заявка</a>
        </div>
      </div>
    </nav>

    
    <div class="header-contacts hidden lg:flex flex-col items-end gap-2">
      <a class="header-phone" href="tel:+74993760000">
        <svg class="header-phone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"/></svg>8 (499) 376-00-00
      </a>
      <a class="btn btn--ghost btn--sm header-cta" href="./kontakty.html#zayavka">Запросить расчёт</a>
    </div>

    
    <details class="mnav lg:hidden">
      <summary>Меню<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9.5 6 6 6-6"/></svg></summary>
      <div class="mnav__panel">
        
        <div class="mnav__scroll">
          <p class="mnav__title">Разделы</p>
          <a href="/">Главная</a>
          <p class="mnav__title mt-5">Направления</p>
          <a href="./mosty.html" >Мосты и путепроводы</a>
          <a href="./npz.html" >НПЗ, нефтебазы, АЗС</a>
          <a href="./podstancii.html" >Подстанции и ОРУ</a>
          <a href="./zdaniya.html" >Здания и склады</a>
          <a href="./okna.html" >Окна и остекление</a>
          <p class="mnav__title mt-5">Решения и материалы</p>
          <a href="./konstrukcii.html" >Конструкции и материалы</a>
          <a href="./zpb.html" >Противоосколочные блоки</a>
          <a href="./proektirovanie.html" >Проектирование и документы</a>
          <p class="mnav__title mt-5">Расчёт и заявка</p>
          <a href="./ceny.html" >Стоимость</a>
          <a href="./kontakty.html" >Контакты и заявка</a>
        </div>
        <div class="mnav__foot">
          <a class="btn btn--primary" href="./kontakty.html#zayavka">Запросить расчёт</a>
          <a class="btn btn--ghost mnav-phone" href="tel:+74993760000">8 (499) 376-00-00</a>
        </div>
      </div>
    </details>
  </div>
</header>
  <main id="main">
  
  <nav class="rail" aria-label="Разделы страницы" data-rail>
  
  <div class="rail__plate" aria-hidden="true" />
  <ol class="rail__list">
    <li class="rail__item">
      <a class="rail__link is-active" href="#main" data-rail-target="main" aria-current="true">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Защита объектов от БПЛА</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#kompleks" data-rail-target="kompleks">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Полный комплекс работ</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#o-kompanii" data-rail-target="o-kompanii">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">О компании</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#napravleniya" data-rail-target="napravleniya">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Каталог направлений</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#kontekst" data-rail-target="kontekst">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Контекст объекта</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#obekty" data-rail-target="obekty">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Объекты</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#zadacha" data-rail-target="zadacha">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Задача</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#linii" data-rail-target="linii">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Две линии предложения</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#materialy" data-rail-target="materialy">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Материалы</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#poryadok" data-rail-target="poryadok">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Состав работ</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#urovni" data-rail-target="urovni">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Уровни защиты</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#pokazateli" data-rail-target="pokazateli">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Показатели</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#garantii" data-rail-target="garantii">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Гарантия и сопровождение</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#normativy" data-rail-target="normativy">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Нормативная база</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#praktika" data-rail-target="praktika">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Патентная чистота и согласования</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#dokumentaciya" data-rail-target="dokumentaciya">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Результат работы</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#cta" data-rail-target="cta">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Расчёт по объекту</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#tendery" data-rail-target="tendery">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Тендеры и госпредприятия</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#ceny" data-rail-target="ceny">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Ориентиры</span>
      </a>
    </li>
    <li class="rail__item">
      <a class="rail__link" href="#zayavka" data-rail-target="zayavka">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__label">Обратная связь</span>
      </a>
    </li>
  </ol>
</nav>

  
  

<section class="hero hero--photo hero--photo-none hero--steps">
  
  <div class="hero__bg" aria-hidden="true">
    <img class="hero__bg-img" src="/landing/images/hero/zok-podstanciya.webp" alt="" width="1672" height="941" fetchpriority="high" decoding="async">
  </div>
  <div class="shell hero__inner">
    <h1 class="h1 mt-5 max-w-5xl">
      <span>Защита объектов от БПЛА</span>
      
      <span class="hero-steps">
<span class="hero-steps__item">обследование</span><span class="hero-steps__item">проект</span><span class="hero-steps__item">изготовление</span><span class="hero-steps__item">монтаж</span>      </span>
<span class="hero__accent">под ключ</span>    </h1>
    <div class="mt-9 flex flex-wrap gap-3">
<a class="btn btn--primary" href="#zayavka">Запросить расчёт<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a><a class="btn btn--ghost" href="#napravleniya">Направления защиты<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a></div>
  </div>
</section>
  
  
<section id="kompleks" class="band feat-band">
  <div class="shell">  <h2 class="sr-only">Полный комплекс работ</h2>
  <ul class="featstrip__row">
  <li class="featstrip-item">
    <svg class="featstrip-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>
    <span>
      <span class="featstrip-item__title">Комплексная защита</span>
<span class="featstrip-item__text">вынесенный рубеж и локальная защита узлов</span>    </span>
  </li>
  <li class="featstrip-item">
    <svg class="featstrip-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.6v3M12 19.4v3M1.6 12h3M19.4 12h3"/></svg>
    <span>
      <span class="featstrip-item__title">Инженерный подход</span>
<span class="featstrip-item__text">расчётный сценарий и проект под объект</span>    </span>
  </li>
  <li class="featstrip-item">
    <svg class="featstrip-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></svg>
    <span>
      <span class="featstrip-item__title">Производство конструкций</span>
<span class="featstrip-item__text">металлокаркас и полотна по проекту</span>    </span>
  </li>
  <li class="featstrip-item">
    <svg class="featstrip-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 21V4.5h13M4.5 4.5 17.5 8"/><path d="M17.5 4.5v3.5"/><path d="M2.5 21h6M15.5 8v3.5h4v-3.5z"/></svg>
    <span>
      <span class="featstrip-item__title">Монтаж и сопровождение</span>
<span class="featstrip-item__text">по наряду-допуску, с регламентом осмотров</span>    </span>
  </li>
  <li class="featstrip-item">
    <svg class="featstrip-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
    <span>
      <span class="featstrip-item__title">Соответствие нормам</span>
<span class="featstrip-item__text">СП 542, паспорт изделия, протоколы</span>    </span>
  </li>
</ul>
</div>
  
</section>
  
  
<section id="o-kompanii" class="band on-light">
  <div class="shell">  <div class="about">
    <div class="about__intro">
      <span class="kicker">О компании</span>
      <h2 class="h2 about__title mt-4">
        <span class="about__brand">форт<span class="brand__accent">Тех</span></span>
        — инженерная защита объектов
      </h2>
      <p class="lead mt-4">Считаем расчётный сценарий, проектируем конструкцию, изготавливаем и монтируем её на действующем объекте, а после сдачи передаём регламент осмотров. Один подрядчик и один договор на весь комплекс — заказчик не собирает проект по частям и не согласовывает границы ответственности между исполнителями.</p>
      
      <a class="btn btn--ink about__cta" href="./o-kompanii.html">Подробнее о компании<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
    </div>
    <div class="catcards">
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Аксонометрия проектного решения: кирпичное здание закрыто сетчатым контуром на независимых опорах, вокруг площадка с газоном" style="background-image: url('/landing/images/kompetencii/proektirovanie.webp')">
<span class="catcard__num">01</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4.5" y="3" width="15" height="18" rx="1.5"/><path d="M8 7.5h8"/><path d="M8.6 12h.01M12 12h.01M15.4 12h.01M8.6 16h.01M12 16h.01M15.4 16h.01"/></svg>
          <h3 class="catcard__title">Проектирование</h3>
        </div>
        <p class="catcard__text">Расчётный сценарий, уровень защиты по СП 542.1325800.2024, схема расстановки, узлы, анкеровка, нагрузки и спецификация.</p>
      </article>
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Сварщик в защитной маске варит стальную конструкцию в цехе, вокруг летят искры" style="background-image: url('/landing/images/kompetencii/proizvodstvo.webp')">
<span class="catcard__num">02</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></svg>
          <h3 class="catcard__title">Производство конструкций</h3>
        </div>
        <p class="catcard__text">Металлокаркас, полотна, крепёж и элементы по спецификации проекта: входной контроль и комплектация поставки.</p>
      </article>
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Секции сетчатого ограждения на стальных рамах вокруг силового трансформатора, за ними изоляторы ОРУ" style="background-image: url('/landing/images/kompetencii/montazh.webp')">
<span class="catcard__num">03</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 21V4.5h13M4.5 4.5 17.5 8"/><path d="M17.5 4.5v3.5"/><path d="M2.5 21h6M15.5 8v3.5h4v-3.5z"/></svg>
          <h3 class="catcard__title">Монтаж систем защиты</h3>
        </div>
        <p class="catcard__text">Монтаж по наряду-допуску с минимальным влиянием на режим объекта: секции собираются на земле и поднимаются готовыми.</p>
      </article>
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Рендер изделия: защитный противоосколочный блок — панель на каркасе с элементами крепления" style="background-image: url('/landing/images/kompetencii/zpb-blok.webp')">
<span class="catcard__num">04</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>
          <h3 class="catcard__title">Противоосколочные блоки</h3>
        </div>
        <p class="catcard__text">Сборные заводские блоки локальной защиты: высоковольтные вводы трансформаторов и реакторов, элементы объектов КИИ.</p>
      </article>
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Лист технических требований и чертёж с планами и узлами на столе" style="background-image: url('/landing/images/kompetencii/dokumentaciya.webp')">
<span class="catcard__num">05</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
          <h3 class="catcard__title">Документация</h3>
        </div>
        <p class="catcard__text">Проект, паспорт изделия, акты выполненных работ и протоколы испытаний — комплект, который можно предъявить проверяющим.</p>
      </article>
      <article class="catcard reveal">


<figure class="catcard__media" role="img" aria-label="Работник в каске у поста с планшетом и папкой чек-листов в цехе" style="background-image: url('/landing/images/kompetencii/soprovozhdenie.webp')">
<span class="catcard__num">06</span></figure>        <div class="catcard__head">
          <svg class="catcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15.4 3.6a4.6 4.6 0 0 0 5.1 6.9l-8.1 8.1a2.6 2.6 0 1 1-3.6-3.6l8-8.1a4.6 4.6 0 0 0-1.4-3.3z"/><path d="m9.2 14.8-.1-.1"/></svg>
          <h3 class="catcard__title">Сопровождение</h3>
        </div>
        <p class="catcard__text">Паспорт изделия, регламент осмотров, обучение персонала, поставка запасных элементов и плановое обслуживание.</p>
      </article>
    </div>
  </div>
</div>
  
</section>
  
  
<section id="napravleniya" class="band grid-bg">
  <div class="shell">  <span class="kicker">Каталог направлений</span><h2 class="h2 mt-4">Что защищаем и как</h2><p class="lead mt-4 max-w-4xl">Шесть направлений: от вынесенного рубежа вокруг объекта до локальных противоосколочных блоков на конкретном оборудовании. Обе линии совмещаются в одном проекте и дополняют друг друга.</p>
  <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/><path d="M4.5 12.2c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/></svg>
      <h3 class="h3 mt-5">Объекты ТЭК: НПЗ, нефтебазы, резервуарные парки</h3>
      <p class="panel__meta mt-3">Вынесенный рубеж вокруг резервуарных парков, сливных эстакад, АЗС и АГЗС: барьеры на независимых опорах, негорючие материалы, заземление.</p>
      <ul class="tick mt-7">
<li>Для резервуаров — только независимая схема каркаса (п. 6.3.1 СП 542)</li><li>На взрывопожароопасных объектах горючие сетки не применяем (п. 9.2.3)</li><li>Монтаж и сварочные работы — по наряду-допуску и плану заказчика</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">2–4-й уровень по СП 542</span><span class="chip">от 14 дней</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./npz.html">Защита объектов ТЭК<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 21 12 3l4 18"/><path d="M6.4 15h11.2M9.2 9h5.6"/><path d="M6 21h12"/></svg>
      <h3 class="h3 mt-5">Подстанции и ОРУ</h3>
      <p class="panel__meta mt-3">Защита ОРУ 35–500 кВ и главных понизительных подстанций: диэлектрические полотна, безопасные расстояния, отдельные контуры заземления и молниезащита.</p>
      <ul class="tick mt-7">
<li>Рубеж держим вне зоны шагового напряжения и мёртвой зоны РЗА</li><li>Работа на действующем объекте — по регламенту и наряду-допуску заказчика</li><li>Дополнительно — противоосколочная защита вводов трансформаторов (ЗПБ)</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">35–500 кВ</span><span class="chip">от 20 дней</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./podstancii.html">Защита подстанций<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4H14a1.5 1.5 0 0 1 1.5 1.5V21"/><path d="M15.5 9.5H19a1.5 1.5 0 0 1 1.5 1.5v10"/><path d="M2.5 21h19"/><path d="M7.5 8h2M7.5 12h2M7.5 16h2"/></svg>
      <h3 class="h3 mt-5">Здания: склады, производство, офисы</h3>
      <p class="panel__meta mt-3">Навесы над кровлей, фасадные экраны, защита ворот, въездов, вентиляции и технологических проёмов. Типовые комплекты — быстро и серийно.</p>
      <ul class="tick mt-7">
<li>Полный контур — для ответственных участков</li><li>Навесы над воротами и въездными группами</li><li>Защита вытяжной вентиляции и наружного оборудования</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">от 7 дней</span><span class="chip">под ключ от 4500 ₽/м²</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./zdaniya.html">Защита зданий<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 9.5h19"/><path d="M4.5 9.5v10M19.5 9.5v10M12 9.5v10"/><path d="M4.5 15.2c3.6-4.2 11.4-4.2 15 0"/></svg>
      <h3 class="h3 mt-5">Мосты и путепроводы</h3>
      <p class="panel__meta mt-3">Армированные сетчатые перекрытия пролётов: недопущение контакта ударного элемента с элементами мостового сооружения и с транспортом на проезжей части.</p>
      <ul class="tick mt-7">
<li>Анкеровка в несущие конструкции с расчётом узлов</li><li>Монтаж с минимальным влиянием на дорожное движение</li><li>Секционное исполнение для пролётов и вантовых элементов</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">материалы от 370 ₽/м²</span><span class="chip">полный комплекс от 2500 ₽/м²</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./mosty.html">Защита мостов<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5v17M3.5 12h17"/></svg>
      <h3 class="h3 mt-5">Окна, витражи и остекление</h3>
      <p class="panel__meta mt-3">Экраны с выносом рубежа на 1–2 м и рольставни: закрывают проём от осколков и не разрушают светопрозрачную конструкцию.</p>
      <ul class="tick mt-7">
<li>Съёмные секции для обслуживания и эвакуационных выходов</li><li>Полиамидная сетка 20×20 мм для сохранения светопропускания</li><li>Аварийные выходы — с доступом изнутри или автоматикой</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">вынос 1–2 м</span><span class="chip">рольставни для проёмов</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./okna.html">Защита остекления<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
    <article class="panel flex flex-col p-6 reveal">
      <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>
      <h3 class="h3 mt-5">Противоосколочная защита оборудования: ЗПБ</h3>
      <p class="panel__meta mt-3">Локальная защита конкретного оборудования подстанции: высоковольтных вводов трансформаторов и реакторов, элементов КИИ. Заводские блоки, а не конструкция по месту.</p>
      <ul class="tick mt-7">
<li>Снижает риск осколочного поражения изоляторов и утечки масла</li><li>Модульная конструкция: повреждённый блок заменяется отдельно</li><li>Размеры и крепления — по фактическим данным заказчика</li></ul>
      <div class="mt-5 flex flex-wrap gap-2">
<span class="chip">натурные испытания</span><span class="chip">испытания под напряжением</span></div>
      
      <div class="mt-auto pt-5">
        <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
        <a class="btn btn--ghost" href="./zpb.html">Противоосколочные блоки<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </article>
  </div>
</div>
  
</section>
  
  
<section id="kontekst" class="band on-light">
<div class="bg-survey" aria-hidden="true">
  <svg class="bg-survey__svg" viewBox="0 0 240 240" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    
    <path class="bg-survey__thin" d="M120 42V28"/>
    <circle class="bg-survey__thin" cx="120" cy="22" r="5"/>
    
    <rect class="bg-survey__body" x="92" y="42" width="56" height="38" rx="4"/>
    <circle class="bg-survey__thin" cx="120" cy="61" r="5"/>
    
    <path class="bg-survey__body" d="M92 52H66a8 8 0 0 0 0 16h26"/>
    <path class="bg-survey__thin" d="M66 52v16"/>
    
    <path class="bg-survey__leg" d="M120 80 44 196M120 80l76 116M120 80v96"/>
    <path class="bg-survey__thin" d="M30 196h28M182 196h28M106 176h28"/>
    <path class="bg-survey__brace" d="M81 140h78"/>
  </svg>
</div>  <div class="shell">  <div class="context">
    <div class="context__copy">
      <span class="kicker">Контекст объекта</span><h2 class="h2 mt-4">Вокруг конструкции продолжается работа</h2><p class="lead mt-4 max-w-4xl">Поэтому проект начинается не с размеров изделия, а с обследования: обмеров, проездов, трасс коммуникаций и действующих конструкций, к которым предстоит крепить защиту.</p>
      <ol class="context__rows">
        <li class="context__row reveal">
          <span class="context__num">01</span>
          <div>
            <h3 class="context__title">Люди, техника и проезды</h3>
            <p class="context__text">Где проходят сотрудники, как движется техника и какие проезды, включая пожарные, нужно сохранить при монтаже и эксплуатации.</p>
          </div>
        </li>
        <li class="context__row reveal">
          <span class="context__num">02</span>
          <div>
            <h3 class="context__title">Обслуживание и технологический доступ</h3>
            <p class="context__text">К чему нужен регулярный доступ, где проходят трассы коммуникаций и какие работы идут в этой зоне.</p>
          </div>
        </li>
        <li class="context__row reveal">
          <span class="context__num">03</span>
          <div>
            <h3 class="context__title">Существующие конструкции</h3>
            <p class="context__text">Что можно использовать для крепления, какие нагрузки допустимы и где нужен самостоятельный каркас или усиление.</p>
          </div>
        </li>
        <li class="context__row reveal">
          <span class="context__num">04</span>
          <div>
            <h3 class="context__title">Свет, вентиляция, эвакуация</h3>
            <p class="context__text">Как конструкция повлияет на естественное освещение, вентиляцию, аварийную эвакуацию и пожаротушение.</p>
          </div>
        </li>
      </ol>
    </div>
    <figure class="context__visual reveal">
      <figcaption class="context__caption">
        <span>Схема площадки</span>
        <span class="context__hint" aria-hidden="true"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9.5 6 6 6-6"/></svg></span>
      </figcaption>
      <div class="context__scene"><svg class="plan" viewBox="0 0 640 480" role="img" aria-label="Условная схема площадки: обсуждаемая зона с защищаемым зданием и оборудованием, проезды и направление подхода" focusable="false">
  <defs>
    <pattern id="plan-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <path class="plan__hatch" d="M0 0V12"/>
    </pattern>
  </defs>
  
  <rect class="plan__ground" x="40" y="36" width="560" height="408" rx="6"/>
  
  <rect class="plan__frame" x="40" y="36" width="560" height="408" rx="6"/>
  <g class="plan__corners">
    <path d="M40 68V36h32"/>
    <path d="M568 36h32v32"/>
    <path d="M600 412v32h-32"/>
    <path d="M72 444H40v-32"/>
  </g>
  
  <path class="plan__road" d="M40 380H560V140"/>
  <path class="plan__road-line" d="M40 380H560V140"/>
  
  <rect class="plan__zone" x="104" y="96" width="300" height="232" rx="3"/>
  <rect class="plan__zone-edge" x="104" y="96" width="300" height="232" rx="3"/>
  
  <rect class="plan__building" x="140" y="132" width="228" height="164" rx="2"/>
  <path class="plan__cell" d="M216 132V296M292 132V296M140 178H368M140 224H368M140 270H368"/>
  <rect class="plan__unit" x="162" y="152" width="52" height="30" rx="1.5"/>
  <rect class="plan__unit" x="162" y="240" width="52" height="32" rx="1.5"/>
  
  <circle class="plan__ring" cx="116" cy="316" r="24"/>
  <circle class="plan__ring" cx="116" cy="316" r="42"/>
  
  <g class="plan__markers">
    <circle class="plan__marker" cx="116" cy="108" r="5"/>
    <circle class="plan__marker" cx="392" cy="108" r="5"/>
    <circle class="plan__marker" cx="116" cy="316" r="5"/>
    <circle class="plan__marker" cx="392" cy="316" r="5"/>
  </g>
  
  <path class="plan__route" d="M596 62C556 92 470 104 404 120"/>
  <path class="plan__arrow" d="M420 114 404 120 410 136"/>
</svg></div>
      <div class="context__legend">
        <span class="context__legend-item">
<i class="context__swatch context__swatch--zone" aria-hidden="true" />          Обсуждаемая зона
        </span>
        <span class="context__legend-item">
<i class="context__swatch context__swatch--building" aria-hidden="true" />          Здание и оборудование
        </span>
        <span class="context__legend-item">
<i class="context__swatch context__swatch--marker" aria-hidden="true" />          Точки обследования
        </span>
        <span class="context__legend-item">
          Условная схема, без масштаба
        </span>
      </div>
    </figure>
  </div>
</div>
  
</section>
  
  
<section id="obekty" class="band flame-band">
  <div class="shell">  
  <span class="kicker">Объекты</span><h2 class="h2 mt-4">Как выглядят защитные конструкции на объектах</h2><p class="lead mt-4 max-w-4xl">Ниже — примеры исполнения: вынесенный рубеж по периметру, навесы над кровлей, перекрытия над оборудованием, независимые каркасы и локальные контуры модульных камер.</p>
  <div class="shots mt-10">
<figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/01-logisticheskiy-kompleks.webp" alt="Сетчатый контур на опорах вокруг логистического комплекса: длинные пролёты вдоль периметра и навес над кровлей" width="1536" height="960" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Логистический комплекс</span>
    <p class="panel__meta">Вынесенный рубеж по периметру: сетчато-тросовые пролёты на опорах закрывают кровлю и разгрузочную зону, не меняя движение транспорта внутри территории.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">Вынесенный рубеж</span><span class="chip">Пролёты на опорах</span></div>
  </figcaption>
</figure><figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/02-sklad-terminal.webp" alt="Навес из сетчатого полотна над кровлей складского терминала на мачтах, вдоль грузовой зоны" width="1672" height="941" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Складской терминал</span>
    <p class="panel__meta">Навес над кровлей на мачтах: полотно поднято выше конструкций здания, проезды и ворота остаются рабочими.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">Навес над кровлей</span><span class="chip">Мачты</span></div>
  </figcaption>
</figure><figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/03-podstanciya-oru.webp" alt="Сетчатое перекрытие над оборудованием открытого распределительного устройства подстанции на независимом каркасе" width="1672" height="941" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Подстанция, ОРУ</span>
    <p class="panel__meta">Перекрытие над оборудованием ОРУ: полотно на независимом каркасе, действующее оборудование и схема заземления не меняются.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">ОРУ</span><span class="chip">Перекрытие над оборудованием</span></div>
  </figcaption>
</figure><figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/04-avtonomnyj-karkas.webp" alt="Автономный металлический каркас с защитным полотном вокруг здания" width="1584" height="990" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Автономный каркас</span>
    <p class="panel__meta">Независимый каркас вокруг здания: когда несущие конструкции объекта нагружать нельзя, крепление идёт на собственные фундаменты.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">Автономный каркас</span><span class="chip">Свои фундаменты</span></div>
  </figcaption>
</figure><figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/05-modulnaya-kamera.webp" alt="Модульная камера с оборудованием, закрытая защитным полотном на каркасе" width="1586" height="992" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Модульная камера</span>
    <p class="panel__meta">Замкнутый контур вокруг модульной камеры с оборудованием: доступ внутрь сохраняется через ворота в секции.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">Модульная камера</span><span class="chip">Замкнутый контур</span></div>
  </figcaption>
</figure><figure class="shot reveal">
  <img class="shot__img" src="/landing/images/obekty/06-machty-fermy-uzly.webp" alt="Монтаж узлов подвеса защитного полотна на мачте и ферме" width="1280" height="800" loading="lazy" decoding="async">
  <figcaption class="shot__cap">
    <span class="shot__title">Мачты, фермы и узлы</span>
    <p class="panel__meta">Узлы подвеса полотна на мачте и ферме: секции собирают на земле и поднимают готовыми, объём работ на высоте меньше.</p>
    <div class="shot__tags flex flex-wrap gap-2">
<span class="chip">Узлы подвеса</span><span class="chip">Монтаж</span></div>
  </figcaption>
</figure>  </div>
<p class="note mt-6 border-l-2 px-4 py-3 text-sm border-ink/40 bg-ink/5">Фотографии приведены как примеры исполнения конструкций. Схема, материалы, узлы и уровень защиты определяются проектом по результатам обследования конкретного объекта.</p></div>
  
</section>
  
<section id="zadacha" class="band on-light">
  <div class="shell">  <span class="kicker">Задача</span><h2 class="h2 mt-4">Защита объекта — это не «натянуть сетку»</h2><p class="lead mt-4 max-w-4xl">БПЛА бьют не по объекту целиком, а по его критичным узлам. Поэтому сначала определяется расчётная цель и слабое звено объекта, и только потом подбирается конструкция.</p>
  <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3.5 21.5 20.5H2.5z"/><path d="M12 9.5v5"/><path d="M12 17.3h.01"/></svg>
    <h3 class="h3 mt-5">Объекты инфраструктуры стали приоритетной целью</h3>
    <p class="panel__meta mt-3">Массовое применение БПЛА сместилось на объекты энергетики, топливной и транспортной инфраструктуры, склады и производственные площадки. Прямое попадание при этом не обязательно: по данным профильной документации в большинстве случаев достаточно разрыва в радиусе 15–20 м от оборудования — осколки и фугасное воздействие уже критичны.</p>
  </article>
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.6v3M12 19.4v3M1.6 12h3M19.4 12h3"/></svg>
    <h3 class="h3 mt-5">Защищать нужно конкретные узлы, а не «площадь»</h3>
    <p class="panel__meta mt-3">Резервуарный парк, сливная эстакада, ОРУ, ввод трансформатора, кровля с технологическим оборудованием, ворота и вентиляция — у каждого узла своя специфика удара. Решение подбирается под узел, траекторию подлёта и режим работы объекта.</p>
  </article>
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
    <h3 class="h3 mt-5">Требования стали обязательными и проверяемыми</h3>
    <p class="panel__meta mt-3">Защита от БПЛА закреплена нормативно: СП 542.1325800.2024, отраслевые акты, статьи об ответственности за безопасность объектов ТЭК. Проект с расчётом, сертификатами и протоколами испытаний проходит проверку, а «видимая сетка» — нет.</p>
  </article>
</div>
</div>
  <div class="deco deco--corner deco--br" aria-hidden="true">
<span class="deco__angle" /><span class="deco__dot" /></div>

</section>
  
<section id="linii" class="band grid-bg">
  <div class="shell">  <span class="kicker">Две линии предложения</span><h2 class="h2 mt-4">Вынесенный рубеж вокруг объекта и локальная защита оборудования</h2><p class="lead mt-4 max-w-4xl">Обе линии дополняют друг друга и совмещаются в одном проекте: рубеж принимает удар за пределами защищаемой зоны, блок локальной защиты закрывает конкретное оборудование, у которого авария запускает каскад.</p>
  <div class="mt-10 grid gap-4 md:grid-cols-2">
<article class="linecard reveal">
  <figure class="media linecard__media">
  <img class="media__img" src="/landing/images/linii/stalnaya-setka-bpla.jpg" alt="Сетчатый контур заводского изготовления вокруг здания газовой инфраструктуры: металлический каркас и полотно сетки" width="1200" height="768" loading="lazy" decoding="async">
<figcaption class="media__credit">Фото: Gjvjoybr, CC0, Wikimedia Commons</figcaption></figure>
  <div class="linecard__body">
<svg class="h-8 w-8 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3.5" width="18" height="17" rx="1"/><path d="M3 9h18M3 14.5h18M9 3.5v17M15 3.5v17"/></svg>    <h3 class="h3 mt-5">Инженерная защита от БПЛА (ЗОК)</h3>
    <p class="panel__meta mt-3">Сетчато-тросовые и комбинированные барьеры вынесенного рубежа: периметр, кровля, фасады, площадки, критические участки.</p>
<ul class="tick mt-7">
<li>Обследование, расчёт сценария и проект</li><li>Изготовление, поставка и монтаж конструкций</li><li>Регламент осмотров и сервисное сопровождение</li></ul><div class="mt-7"><a class="btn btn--ghost" href="konstrukcii.html">Подобрать конструкцию<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a></div>  </div>
</article><article class="linecard reveal">
  <figure class="media linecard__media">
  <img class="media__img" src="/landing/images/linii/zpb-blok-vod.jpg" alt="Визуализация защитного противоосколочного блока: панель на каркасе, закреплённая на полипропиленовых шнурах" width="1200" height="900" loading="lazy" decoding="async">
<figcaption class="media__credit">Визуализация изделия по документации</figcaption></figure>
  <div class="linecard__body">
<svg class="h-8 w-8 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>    <h3 class="h3 mt-5">Защитные противоосколочные блоки (ЗПБ)</h3>
    <p class="panel__meta mt-3">Сборные заводские блоки локальной защиты: высоковольтные вводы трансформаторов и реакторов, элементы объектов КИИ.</p>
<ul class="tick mt-7">
<li>Подбор конструкции под фактические данные оборудования</li><li>Поставка, комплектация и проектная увязка</li><li>Монтаж по регламенту действующего объекта</li></ul><div class="mt-7"><a class="btn btn--ghost" href="zpb.html">Про блоки ЗПБ<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a></div>  </div>
</article>  </div>
</div>
  
</section>
  
<section id="materialy" class="band on-light">
  <div class="shell">  <span class="kicker">Материалы</span><h2 class="h2 mt-4">Из чего делаем защитные конструкции</h2><p class="lead mt-4 max-w-4xl">Один материал не может быть лучшим сразу по прочности, весу, стойкости к огню и УФ. Выбор — это компромисс под конкретный объект: во вкладках — по каждому материалу как он выглядит, что даёт объекту и чем ограничен, отдельно — сравнение всех вариантов по параметрам и то, что мы не применяем сознательно.</p>
  <div class="tabs mt-10" data-tabs>
    <div class="tabs__list" role="tablist" aria-label="Материалы защитных конструкций">
      
      <button id="mat-tab-svmpe" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-svmpe">СВМПЭ</button>
      
      <button id="mat-tab-aramid" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-aramid">Арамид</button>
      
      <button id="mat-tab-stalnoy-tros" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-stalnoy-tros">Стальной трос</button>
      
      <button id="mat-tab-bazaltoplastik" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-bazaltoplastik">Базальтопластик</button>
      
      <button id="mat-tab-poliamid" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-poliamid">Полиамид</button>
      
      <button id="mat-tab-polipropilen" type="button" class="tabs__tab" role="tab" aria-controls="mat-panel-polipropilen">Полипропилен</button>
      
      <button id="mat-tab-compare" type="button" class="tabs__tab tabs__tab--strong" role="tab" aria-controls="mat-panel-compare">Сравнение по параметрам</button>
    </div>
    <div class="tabs__panels">
      <section id="mat-panel-svmpe" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-svmpe">
        <div class="matpanel">
          <figure class="media matpanel__media">
  <img class="media__img" src="/landing/images/materialy/svmpe-dyneema-kanat.jpg" alt="Трос с сердечником из СВМПЭ (Dyneema) в разрезе: волокна сердечника и плетение оплётки" width="1200" height="500" loading="lazy" decoding="async">
<figcaption class="media__credit"><a href="https://commons.wikimedia.org/wiki/File:LIROS_XTR_Dyneema.jpg" target="_blank" rel="noopener">Фото: Justsail, CC BY-SA 3.0, Wikimedia Commons</a></figcaption></figure>
          <div class="matpanel__body">
            <h3 class="matpanel__title"><svg class="h-5 w-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></svg><span>СВМПЭ</span></h3>
            <p class="matpanel__text">Максимальная прочность при минимальном весе, но материал горюч: на объектах категорий А и Б по пожарной опасности его не применяем — это прямое ограничение п. 9.2.3 СП 542.</p>
            <dl class="spec">
              <div class="spec__row"><dt>Прочность на разрыв</dt><dd>Высокая</dd></div>
              <div class="spec__row"><dt>Вес конструкции</dt><dd>Минимальный</dd></div>
              <div class="spec__row"><dt>Растяжение под нагрузкой</dt><dd>Низкое</dd></div>
              <div class="spec__row"><dt>Электропроводность</dt><dd>Диэлектрик</dd></div>
              <div class="spec__row"><dt>Искробезопасность</dt><dd>Да</dd></div>
              <div class="spec__row"><dt>Горючесть</dt><dd>Требует проверки по марке</dd></div>
              <div class="spec__row"><dt>УФ- и морозостойкость</dt><dd>Нужна защита от УФ</dd></div>
              <div class="spec__row"><dt>Срок службы</dt><dd>20+ лет</dd></div>
              <div class="spec__row"><dt>Цена материала</dt><dd>Выше средней</dd></div>
              <div class="spec__row"><dt>Светопропускание</dt><dd>Низкое</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section id="mat-panel-aramid" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-aramid">
        <div class="matpanel">
          <figure class="media matpanel__media">
  <img class="media__img" src="/landing/images/materialy/aramid-kevlar-nit.jpg" alt="Катушки пара-арамидной нити (кевлара) на производстве" width="1200" height="816" loading="lazy" decoding="async">
<figcaption class="media__credit"><a href="https://commons.wikimedia.org/wiki/File:Para_Aramid_Yarns_Body_Armor.jpg" target="_blank" rel="noopener">Фото: Bodyarmor, CC BY-SA 3.0, Wikimedia Commons</a></figcaption></figure>
          <div class="matpanel__body">
            <h3 class="matpanel__title"><svg class="h-5 w-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg><span>Арамид (кевлар)</span></h3>
            <p class="matpanel__text">Лучший баланс по УФ- и морозостойкости, стабильно ведёт себя в диапазоне температур. Минусы — меньший срок службы и более высокая цена по сравнению с тросом.</p>
            <dl class="spec">
              <div class="spec__row"><dt>Прочность на разрыв</dt><dd>Высокая</dd></div>
              <div class="spec__row"><dt>Вес конструкции</dt><dd>Малый</dd></div>
              <div class="spec__row"><dt>Растяжение под нагрузкой</dt><dd>Низкое</dd></div>
              <div class="spec__row"><dt>Электропроводность</dt><dd>Диэлектрик</dd></div>
              <div class="spec__row"><dt>Искробезопасность</dt><dd>Да</dd></div>
              <div class="spec__row"><dt>Горючесть</dt><dd>Требует проверки по марке</dd></div>
              <div class="spec__row"><dt>УФ- и морозостойкость</dt><dd>УФ-стабилизация в составе</dd></div>
              <div class="spec__row"><dt>Срок службы</dt><dd>7–10 лет</dd></div>
              <div class="spec__row"><dt>Цена материала</dt><dd>Средняя</dd></div>
              <div class="spec__row"><dt>Светопропускание</dt><dd>Среднее</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section id="mat-panel-stalnoy-tros" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-stalnoy-tros">
        <div class="matpanel">
          <figure class="media matpanel__media">
  <img class="media__img" src="/landing/images/materialy/stalnoy-tros-kanat.jpg" alt="Стальной канат крупным планом: пряди и отдельные проволоки" width="1200" height="800" loading="lazy" decoding="async">
<figcaption class="media__credit"><a href="https://commons.wikimedia.org/wiki/File:Steel_wire_rope_on_a_drum.jpg" target="_blank" rel="noopener">Фото: W.carter, CC0, Wikimedia Commons</a></figcaption></figure>
          <div class="matpanel__body">
            <h3 class="matpanel__title"><svg class="h-5 w-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 5.5c0 4.5 3 5 3 8s-3 2.5-3 5"/><path d="M19.5 5.5c0 4.5-3 5-3 8s3 2.5 3 5"/><path d="M7.5 11.5h9M7.5 14.5h9"/></svg><span>Стальной трос</span></h3>
            <p class="matpanel__text">Самое дешёвое решение с наибольшим сроком службы при цинковании. Требует обязательного заземления и контроля контура: материал электропроводен, во взрывоопасных зонах это критично.</p>
            <dl class="spec">
              <div class="spec__row"><dt>Прочность на разрыв</dt><dd>Высокая, но при большем весе</dd></div>
              <div class="spec__row"><dt>Вес конструкции</dt><dd>Значительный</dd></div>
              <div class="spec__row"><dt>Растяжение под нагрузкой</dt><dd>Есть</dd></div>
              <div class="spec__row"><dt>Электропроводность</dt><dd>Проводник — заземление обязательно</dd></div>
              <div class="spec__row"><dt>Искробезопасность</dt><dd>Только с заземлением и контролем</dd></div>
              <div class="spec__row"><dt>Горючесть</dt><dd>Негорюч</dd></div>
              <div class="spec__row"><dt>УФ- и морозостойкость</dt><dd>Не критична при покрытии</dd></div>
              <div class="spec__row"><dt>Срок службы</dt><dd>10+ лет с покрытием</dd></div>
              <div class="spec__row"><dt>Цена материала</dt><dd>Ниже средней</dd></div>
              <div class="spec__row"><dt>Светопропускание</dt><dd>Низкое</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section id="mat-panel-bazaltoplastik" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-bazaltoplastik">
        <div class="matpanel">
          <figure class="media matpanel__media">
  <img class="media__img" src="/landing/images/materialy/bazaltovoe-volokno.jpg" alt="Образцы базальтового и стеклянного волокна, подготовленные к огневому испытанию" width="1200" height="675" loading="lazy" decoding="async">
<figcaption class="media__credit"><a href="https://commons.wikimedia.org/wiki/File:Basalt_fibre_and_glass_fibre.jpg" target="_blank" rel="noopener">Фото: Nils Austa, CC BY 3.0, Wikimedia Commons</a></figcaption></figure>
          <div class="matpanel__body">
            <h3 class="matpanel__title"><svg class="h-5 w-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21c3.6 0 6.5-2.7 6.5-6.1 0-4.4-4.1-6.4-5.5-11.4-1.9 3.1-4.6 3.6-5.9 6.3-.8 1.6-1.1 3.2-1.1 5.1C6 18.3 8.4 21 12 21z"/><path d="M12 21c1.6 0 2.8-1.2 2.8-2.8 0-2-1.7-2.6-2.3-4.7-1 1.4-2.6 2.2-2.6 4.5 0 1.7 1.2 3 2.1 3z"/></svg><span>Базальтопластик</span></h3>
            <p class="matpanel__text">Негорючий и химически стойкий материал, применяется на объектах с высокими требованиями к пожарной безопасности, включая участки с температурами до 1500 °C.</p>
            <dl class="spec">
              <div class="spec__row"><dt>Прочность на разрыв</dt><dd>Высокая</dd></div>
              <div class="spec__row"><dt>Вес конструкции</dt><dd>Средний</dd></div>
              <div class="spec__row"><dt>Растяжение под нагрузкой</dt><dd>Низкое</dd></div>
              <div class="spec__row"><dt>Электропроводность</dt><dd>Диэлектрик</dd></div>
              <div class="spec__row"><dt>Искробезопасность</dt><dd>Да</dd></div>
              <div class="spec__row"><dt>Горючесть</dt><dd>Негорюч, применяется при температурах до 1500 °C</dd></div>
              <div class="spec__row"><dt>УФ- и морозостойкость</dt><dd>Высокая</dd></div>
              <div class="spec__row"><dt>Срок службы</dt><dd>15+ лет</dd></div>
              <div class="spec__row"><dt>Цена материала</dt><dd>Средняя</dd></div>
              <div class="spec__row"><dt>Светопропускание</dt><dd>Непрозрачен</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section id="mat-panel-poliamid" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-poliamid">
        <div class="matpanel">
          <figure class="media matpanel__media">
  <img class="media__img" src="/landing/images/materialy/poliamidnaya-setka.jpg" alt="Ячейка полиамидной сети крупным планом: узлы вязки и размер ячейки" width="1200" height="800" loading="lazy" decoding="async">
<figcaption class="media__credit"><a href="https://commons.wikimedia.org/wiki/File:Maillage_d%27un_filet_de_p%C3%AAche_%C3%A0_la_civelle_(1).JPG" target="_blank" rel="noopener">Фото: Jean-Pierre Bazard (Jpbazard), CC BY-SA 3.0, Wikimedia Commons</a></figcaption></figure>
          <div class="matpanel__body">
            <h3 class="matpanel__title"><svg class="h-5 w-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5v17M3.5 12h17"/></svg><span>Полиамид (сетка)</span></h3>
            <p class="matpanel__text">Экономичное и светопрозрачное решение для окон, витражей и проёмов, где важно сохранить освещённость. Срок службы меньше: 5–10 лет, требуется УФ-модификация.</p>
            <dl class="spec">
              <div class="spec__row"><dt>Прочность на разрыв</dt><dd>Средняя</dd></div>
              <div class="spec__row"><dt>Вес конструкции</dt><dd>Малый</dd></div>
              <div class="spec__row"><dt>Растяжение под нагрузкой</dt><dd>Есть, нужен запас хода</dd></div>
              <div class="spec__row"><dt>Электропроводность</dt><dd>Диэлектрик</dd></div>
              <div class="spec__row"><dt>Искробезопасность</dt><dd>Да</dd></div>
              <div class="spec__row"><dt>Горючесть</dt><dd>Возможны FR-модификации</dd></div>
              <div class="spec__row"><dt>УФ- и морозостойкость</dt><dd>Нужна УФ-модификация</dd></div>
              <div class="spec__row"><dt>Срок службы</dt><dd>5–10 лет</dd></div>
              <div class="spec__row"><dt>Цена материала</dt><dd>Низкая</dd></div>
              <div class="spec__row"><dt>Светопропускание</dt><dd>Высокое (20×20 мм)</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section id="mat-panel-polipropilen" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-polipropilen">
        <div class="panel panel--accent p-6 md:p-8">
          <h3 class="h3">Почему не используем полипропилен и поликарбонат в качестве защиты</h3>
          <ul class="tick mt-7">
<li>УФ-деградация: обычный полипропилен теряет прочность уже через 1–2 сезона и рвётся от ветровой нагрузки.</li><li>Низкая стойкость к динамике: материал не рассчитан на импульсную нагрузку от удара и осколков.</li><li>Горючесть: при пожаре полипропилен плавится и поддерживает горение, поликарбонат деформируется и теряет несущую способность.</li><li>Отсутствие инженерного расчёта: по таким полотнам нет данных по предельным нагрузкам, узлам и анкеровке — проект не подтвердить расчётом.</li><li>Ложное чувство защиты: конструкция создаёт видимость защиты, но на объектах КИИ и ТЭК требованием является документально подтверждённый уровень.</li></ul>
          <p class="note mt-6 border-l-2 px-4 py-3 text-sm border-volt/60 bg-volt/5">Полипропилен и сотовый поликарбонат допустимы как временное или декоративное решение, но не как элемент защиты объекта. Для объекта, который нужно защитить по документации, применяем материалы с расчётными характеристиками и подтверждениями.</p>
        </div>
      </section>
      <section id="mat-panel-compare" class="tabs__panel" role="tabpanel" aria-labelledby="mat-tab-compare">
        
        <h3 class="h3">Сравнение по параметрам</h3>
<p class="lead mt-3">Пять материалов в одной таблице: видно, чем платим за прочность, вес, светопропускание и пожарную безопасность.</p>        <div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Параметр</th><th scope="col">СВМПЭ</th><th scope="col">Арамид (кевлар)</th><th scope="col">Стальной трос</th><th scope="col">Базальтопластик</th><th scope="col">Полиамид (сетка)</th></tr></thead>
    <tbody>
      <tr><td>Прочность на разрыв</td><td>Высокая</td><td>Высокая</td><td>Высокая, но при большем весе</td><td>Высокая</td><td>Средняя</td></tr>
      <tr><td>Вес конструкции</td><td>Минимальный</td><td>Малый</td><td>Значительный</td><td>Средний</td><td>Малый</td></tr>
      <tr><td>Растяжение под нагрузкой</td><td>Низкое</td><td>Низкое</td><td>Есть</td><td>Низкое</td><td>Есть, нужен запас хода</td></tr>
      <tr><td>Электропроводность</td><td>Диэлектрик</td><td>Диэлектрик</td><td>Проводник — заземление обязательно</td><td>Диэлектрик</td><td>Диэлектрик</td></tr>
      <tr><td>Искробезопасность</td><td>Да</td><td>Да</td><td>Только с заземлением и контролем</td><td>Да</td><td>Да</td></tr>
      <tr><td>Горючесть</td><td>Требует проверки по марке</td><td>Требует проверки по марке</td><td>Негорюч</td><td>Негорюч, применяется при температурах до 1500 °C</td><td>Возможны FR-модификации</td></tr>
      <tr><td>УФ- и морозостойкость</td><td>Нужна защита от УФ</td><td>УФ-стабилизация в составе</td><td>Не критична при покрытии</td><td>Высокая</td><td>Нужна УФ-модификация</td></tr>
      <tr><td>Срок службы</td><td>20+ лет</td><td>7–10 лет</td><td>10+ лет с покрытием</td><td>15+ лет</td><td>5–10 лет</td></tr>
      <tr><td>Цена материала</td><td>Выше средней</td><td>Средняя</td><td>Ниже средней</td><td>Средняя</td><td>Низкая</td></tr>
      <tr><td>Светопропускание</td><td>Низкое</td><td>Среднее</td><td>Низкое</td><td>Непрозрачен</td><td>Высокое (20×20 мм)</td></tr>
    </tbody>
  </table>
</div>
      </section>
    </div>
  </div>
<p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">Характеристики материалов приводим по документации изготовителей и протоколам испытаний как свойства изделия, а не как гарантию результата на любом объекте.</p></div>
  <div class="deco deco--ticks deco--bl" aria-hidden="true">
<span class="deco__ticks"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span></div>

</section>
  
  
<section id="poryadok" class="band process-band">
  <div class="shell">  <div class="process">
    <div class="process__aside">
      <span class="kicker">Состав работ</span><h2 class="h2 mt-4">Один подрядчик ведёт все шесть этапов: от выезда инженера до сервиса</h2><p class="lead mt-4 max-w-4xl">Заказчик не собирает проект по частям и не согласовывает границы ответственности между исполнителями: один договор на весь комплекс.</p>
      <ul class="process__points">
        <li class="process__point">
          <span class="process__mark"><svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4.5 12.5 5 5 10-11"/></svg></span>
          <span>Один договор на весь комплекс: обследование, проект, изготовление, монтаж и документация</span>
        </li>
        <li class="process__point">
          <span class="process__mark"><svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4.5 12.5 5 5 10-11"/></svg></span>
          <span>Гарантия на конструкции и монтажные работы — по договору</span>
        </li>
        <li class="process__point">
          <span class="process__mark"><svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4.5 12.5 5 5 10-11"/></svg></span>
          <span>Единый комплект документов: проект, паспорт изделия, акты и протоколы испытаний</span>
        </li>
      </ul>
    </div>
    <ol class="process__grid">
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">01</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/></svg>
        </div>
        <h3 class="stepcard__title">Обследование объекта</h3>
        <p class="stepcard__text">Выезд инженера, обмеры, фотофиксация, анализ узлов, доступности, режима работы и существующих коммуникаций.</p>
      </li>
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">02</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4.5" y="3" width="15" height="18" rx="1.5"/><path d="M8 7.5h8"/><path d="M8.6 12h.01M12 12h.01M15.4 12h.01M8.6 16h.01M12 16h.01M15.4 16h.01"/></svg>
        </div>
        <h3 class="stepcard__title">Расчёт и проект</h3>
        <p class="stepcard__text">Расчётный сценарий, уровень защиты по СП 542, схема расстановки, узлы, анкеровка, нагрузки, спецификация.</p>
      </li>
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">03</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
        </div>
        <h3 class="stepcard__title">Согласование</h3>
        <p class="stepcard__text">Разделы проекта для заказчика и надзорных органов, увязка с существующей инфраструктурой и регламентами объекта.</p>
      </li>
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">04</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/></svg>
        </div>
        <h3 class="stepcard__title">Изготовление и поставка</h3>
        <p class="stepcard__text">Металлокаркас, полотна, крепёж и элементы по спецификации проекта, входной контроль, комплектация поставки.</p>
      </li>
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">05</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 21V4.5h13M4.5 4.5 17.5 8"/><path d="M17.5 4.5v3.5"/><path d="M2.5 21h6M15.5 8v3.5h4v-3.5z"/></svg>
        </div>
        <h3 class="stepcard__title">Монтаж</h3>
        <p class="stepcard__text">Монтаж по наряду-допуску с минимальным влиянием на режим объекта: секции собираются на земле и поднимаются готовыми.</p>
      </li>
      <li class="stepcard reveal">
        <div class="stepcard__head">
          <span class="stepcard__num">06</span>
          <svg class="stepcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15.4 3.6a4.6 4.6 0 0 0 5.1 6.9l-8.1 8.1a2.6 2.6 0 1 1-3.6-3.6l8-8.1a4.6 4.6 0 0 0-1.4-3.3z"/><path d="m9.2 14.8-.1-.1"/></svg>
        </div>
        <h3 class="stepcard__title">Регламент и сервис</h3>
        <p class="stepcard__text">Паспорт изделия, регламент осмотров, обучение персонала, поставка запасных элементов, плановое обслуживание.</p>
      </li>
    </ol>
  </div>
</div>
  
</section>
  
<section id="urovni" class="band flame-band">
  <div class="shell">  
  <span class="kicker">Уровни защиты</span><h2 class="h2 mt-4">Уровни защиты по СП 542.1325800.2024</h2><p class="lead mt-4 max-w-4xl">Уровень защиты — это не «толщина сетки», а расчётный сценарий: 1-й уровень — максимальный, 4-й — базовый. От уровня зависят тип конструкции, материалы и схема расстановки — ниже соответствие уровня, типов БПЛА и состава защитной конструкции.</p>
  <ol class="levels mt-10">
    <li class="panel panel--practice levelcard reveal panel--accent">
      <h3 class="levelcard__title">1-й уровень</h3>
      <span class="levelcard__rank">максимальный</span>
      <dl class="levelcard__specs">
        <div class="levelcard__spec">
          <dt class="levelcard__label">Типы БПЛА</dt>
          <dd class="levelcard__value">Все типы, включая средние с боевой частью</dd>
        </div>
        <div class="levelcard__spec">
          <dt class="levelcard__label">Состав ЗОК</dt>
          <dd class="levelcard__value">Сетки и дополнительные сетки, тросы, опоры, растяжки, тюфяки и маты, противоосколочные стенки</dd>
        </div>
      </dl>
    </li>
    <li class="panel panel--practice levelcard reveal">
      <h3 class="levelcard__title">2-й уровень</h3>
      <span class="levelcard__rank">усиленный</span>
      <dl class="levelcard__specs">
        <div class="levelcard__spec">
          <dt class="levelcard__label">Типы БПЛА</dt>
          <dd class="levelcard__value">Малые, лёгкие и средние БПЛА</dd>
        </div>
        <div class="levelcard__spec">
          <dt class="levelcard__label">Состав ЗОК</dt>
          <dd class="levelcard__value">Сетки и дополнительные сетки, тросы, опоры, растяжки</dd>
        </div>
      </dl>
    </li>
    <li class="panel panel--practice levelcard reveal">
      <h3 class="levelcard__title">3-й уровень</h3>
      <span class="levelcard__rank">стандартный</span>
      <dl class="levelcard__specs">
        <div class="levelcard__spec">
          <dt class="levelcard__label">Типы БПЛА</dt>
          <dd class="levelcard__value">Малые и лёгкие БПЛА</dd>
        </div>
        <div class="levelcard__spec">
          <dt class="levelcard__label">Состав ЗОК</dt>
          <dd class="levelcard__value">Сетки, тросы, опоры</dd>
        </div>
      </dl>
    </li>
    <li class="panel panel--practice levelcard reveal">
      <h3 class="levelcard__title">4-й уровень</h3>
      <span class="levelcard__rank">базовый</span>
      <dl class="levelcard__specs">
        <div class="levelcard__spec">
          <dt class="levelcard__label">Типы БПЛА</dt>
          <dd class="levelcard__value">Только малые БПЛА</dd>
        </div>
        <div class="levelcard__spec">
          <dt class="levelcard__label">Состав ЗОК</dt>
          <dd class="levelcard__value">Сетки, тросы, опоры</dd>
        </div>
      </dl>
    </li>
  </ol>
  
</div>
  
</section>
  
  
<section id="pokazateli" class="band on-light">
  <div class="shell">  <span class="kicker">Показатели</span><h2 class="h2 mt-4">Ключевые цифры</h2>
  <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  <div class="stat reveal">
    <div class="stat__value">1–4</div>
    <p class="stat__label">уровень защиты по СП 542.1325800.2024</p>
  </div>
  <div class="stat reveal">
    <div class="stat__value">до 400 кг</div>
    <p class="stat__label">расчётная масса БПЛА по натурным испытаниям</p>
  </div>
  <div class="stat reveal">
    <div class="stat__value">до 200 км/ч</div>
    <p class="stat__label">скорость цели в испытаниях конструкций</p>
  </div>
  <div class="stat reveal">
    <div class="stat__value">10–20 лет</div>
    <p class="stat__label">срок службы конструкций</p>
  </div>
  <div class="stat reveal">
    <div class="stat__value">от 7 дней</div>
    <p class="stat__label">типовой комплект на здание</p>
  </div>
  <div class="stat reveal">
    <div class="stat__value">2 линии</div>
    <p class="stat__label">вынесенный рубеж и локальная защита оборудования</p>
  </div>
</div>
</div>
  
</section>
  
<section id="garantii" class="band grid-bg">
  <div class="shell">  <span class="kicker">Гарантия и сопровождение</span><h2 class="h2 mt-4">Что получает заказчик после монтажа</h2>
  <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
    <h3 class="h3 mt-5">Проект и паспорт изделия</h3>
    <p class="panel__meta mt-3">Проектная документация, паспорт изделия, акты выполненных работ и протоколы испытаний — комплект, который можно предъявить проверяющим.</p>
  </article>
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>
    <h3 class="h3 mt-5">Гарантия по договору</h3>
    <p class="panel__meta mt-3">Гарантийные обязательства на конструкции и монтажные работы фиксируются в договоре, срок — по согласованию с заказчиком.</p>
  </article>
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15.4 3.6a4.6 4.6 0 0 0 5.1 6.9l-8.1 8.1a2.6 2.6 0 1 1-3.6-3.6l8-8.1a4.6 4.6 0 0 0-1.4-3.3z"/><path d="m9.2 14.8-.1-.1"/></svg>
    <h3 class="h3 mt-5">Регламент осмотров</h3>
    <p class="panel__meta mt-3">Программа осмотров и обслуживания: что и с какой периодичностью проверять, как фиксировать повреждения и менять секции.</p>
  </article>
  <article class="panel p-6 reveal">
    <svg class="h-7 w-7 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></svg>
    <h3 class="h3 mt-5">Запас элементов</h3>
    <p class="panel__meta mt-3">Поставка запасных секций, полотен и крепежа, чтобы замена занимала часы, а не недели.</p>
  </article>
</div>
</div>
  
</section>
  
<section id="normativy" class="band on-light">
<div class="bg-scheme" aria-hidden="true">
  <svg class="bg-scheme__svg" viewBox="0 0 560 560" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    
    <g class="bg-scheme__ring">
      <circle cx="280" cy="280" r="254"/>
      <circle cx="280" cy="280" r="198"/>
      <circle cx="280" cy="280" r="142"/>
    </g>
    
    <path class="bg-scheme__contour" d="M128 300 C 128 150, 432 150, 432 300"/>
    <path class="bg-scheme__contour" d="M280 300 V156"/>
    <path class="bg-scheme__contour" d="M156 232 H404"/>
    <path class="bg-scheme__contour" d="M192 300 V190"/>
    <path class="bg-scheme__contour" d="M368 300 V190"/>
    
    <rect class="bg-scheme__object" x="152" y="300" width="256" height="208" rx="8"/>
    <path class="bg-scheme__object" d="M152 348 H408M152 396 H408M152 444 H408"/>
    <path class="bg-scheme__object" d="M216 300 V508M344 300 V508"/>
    
    <path class="bg-scheme__path" d="M452 118 C 430 160, 360 180, 300 178"/>
    <circle class="bg-scheme__dot" cx="452" cy="118" r="7"/>
    <circle class="bg-scheme__dot" cx="280" cy="300" r="6"/>
  </svg>
</div>
<div class="bg-ticks" aria-hidden="true">
  <span class="deco__ticks deco__ticks--a"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span>
  <span class="deco__ticks deco__ticks--b"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span>
  <span class="deco__ticks deco__ticks--c"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span>
  <span class="deco__ticks deco__ticks--d"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span>
</div>  <div class="shell">  <span class="kicker">Нормативная база</span><h2 class="h2 mt-4">На что опираемся в проекте</h2><p class="lead mt-4 max-w-4xl">Состав нормативных документов зависит от типа объекта и требований заказчика. Ниже — база, на которую ссылаемся при расчёте, проектировании и подборе материалов.</p>
  
  
  <p class="note note--comment mt-6">18 документов по направлению. Тексты открываются на первоисточниках: ФГИС Росстандарта, официальный портал опубликования правовых актов, справочные правовые системы</p>
  <div class="tabs mt-8" data-tabs>
    <div class="tabs__list" role="tablist" aria-label="Группы нормативных документов">
      <button id="normativy-tab-acts" type="button" class="tabs__tab" role="tab" aria-controls="normativy-panel-acts">Законы и подзаконные акты<span class="tabs__count">8</span></button>
      <button id="normativy-tab-sp" type="button" class="tabs__tab" role="tab" aria-controls="normativy-panel-sp">Своды правил и стандарты<span class="tabs__count">8</span></button>
      <button id="normativy-tab-industry" type="button" class="tabs__tab" role="tab" aria-controls="normativy-panel-industry">Отраслевые и ведомственные документы<span class="tabs__count">2</span></button>
    </div>
    <div class="tabs__panels">
      <section id="normativy-panel-acts" class="tabs__panel" role="tabpanel" aria-labelledby="normativy-tab-acts">
        <div class="docpanel__head">
          <h3 class="docpanel__title">Законы и подзаконные акты</h3>
          <span class="docpanel__count">8</span>
        </div>
        <p class="docpanel__note">Задают обязательность мероприятий, категорию объекта и состав документов, которые проверяют надзорные органы.</p>
        <div class="docgrid">
<article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">123-ФЗ</span>
<h4 class="doc-card__name">Технический регламент о требованиях пожарной безопасности</h4>  <p class="panel__meta mt-3">Класс материалов, горючесть и огнестойкость узлов: по нему выбираем полотна и подтверждаем пожарные свойства конструкций на взрывопожароопасных объектах.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://www.consultant.ru/document/cons_doc_LAW_78699/" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">КонсультантПлюс</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ФЗ № 256-ФЗ</span>
<h4 class="doc-card__name">О безопасности объектов топливно-энергетического комплекса</h4>  <p class="panel__meta mt-3">Категория опасности объекта и обязательность мероприятий по защите: определяет, какие требования применяем и что фиксируем в паспорте безопасности.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>Запросить редакцию</a>
    <span class="doc-card__src">вышлем с расчётом</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ПП РФ № 459</span>
  <p class="panel__meta mt-3">Порядок категорирования объектов топливно-энергетического комплекса: от категории зависит состав мероприятий и уровень защиты.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>Запросить редакцию</a>
    <span class="doc-card__src">вышлем с расчётом</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ПП РФ № 1046</span>
  <p class="panel__meta mt-3">Требования к антитеррористической защищённости объектов ТЭК: применяем в объёме, применимом к конкретному объекту, вместе с отраслевыми актами.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>Запросить редакцию</a>
    <span class="doc-card__src">вышлем с расчётом</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ПП РФ № 258</span>
  <p class="panel__meta mt-3">Требования к антитеррористической защищённости промышленных объектов: объекты ТЭК из сферы действия этого акта исключены, поэтому применимость проверяем по каждому объекту отдельно.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="http://publication.pravo.gov.ru/document/0001202403040010" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">publication.pravo.gov.ru</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ФЗ № 151-ФЗ от 25.05.2026</span>
<h4 class="doc-card__name">О внесении изменений в Федеральный закон «О безопасности объектов топливно-энергетического комплекса» и отдельные законодательные акты</h4>  <p class="panel__meta mt-3">Новые требования к защите объектов ТЭК от БПЛА: учитываем сроки вступления в силу и состав обязательных мероприятий.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="http://publication.pravo.gov.ru/document/0001202605250034" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">publication.pravo.gov.ru</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">Указ Президента РФ № 604 от 24.08.2026</span>
<h4 class="doc-card__name">О мерах по обеспечению безопасности объектов критической инфраструктуры Российской Федерации</h4>  <p class="panel__meta mt-3">Ответственность за непринятие мер по защите критической инфраструктуры: влияет на состав и приоритет мероприятий на объекте.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="http://publication.pravo.gov.ru/document/0001202608240009" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">publication.pravo.gov.ru</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">Ст. 217.1 УК РФ</span>
<h4 class="doc-card__name">Уголовный кодекс Российской Федерации, статья 217.1</h4>  <p class="panel__meta mt-3">Уголовная ответственность за нарушение требований безопасности объектов ТЭК: показывает, что защита объекта — обязательное требование, а не добровольное улучшение.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://www.consultant.ru/document/cons_doc_LAW_10699/" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">УК РФ, КонсультантПлюс</span>
  </div>
</article>        </div>
      </section>
      <section id="normativy-panel-sp" class="tabs__panel" role="tabpanel" aria-labelledby="normativy-tab-sp">
        <div class="docpanel__head">
          <h3 class="docpanel__title">Своды правил и стандарты</h3>
          <span class="docpanel__count">8</span>
        </div>
        <p class="docpanel__note">По этим документам считаем нагрузки, назначаем узлы, подбираем материалы и подтверждаем характеристики испытаниями.</p>
        <div class="docgrid">
<article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">СП 542.1325800.2024</span>
<h4 class="doc-card__name">Защитные ограждающие конструкции от беспилотных летательных аппаратов. Правила проектирования</h4>  <p class="panel__meta mt-3">Базовый документ: уровни защиты, состав защитных конструкций, требования к материалам и расчётным сценариям. С 10 февраля 2026 года включён в реестр обязательных требований, применяемых при государственной экспертизе.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/sp/details/41e54183-7ee2-4e0f-abc3-dc110cf58263" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">СП 20.13330.2016</span>
<h4 class="doc-card__name">Нагрузки и воздействия</h4>  <p class="panel__meta mt-3">Ветровые, гололёдные и динамические нагрузки на каркас и анкеровку: расчётный аппарат для проверки узлов и фундаментов.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/sp/details/bac9e1fe-45f1-401b-8e32-949f4ee27821" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ГОСТ Р 59789-2021</span>
<h4 class="doc-card__name">Молниезащита. Часть 3. Защита зданий и сооружений от повреждений и защита людей и животных от электротравматизма</h4>  <p class="panel__meta mt-3">Металлические элементы защитных конструкций включаем в систему молниезащиты объекта: узлы, заземление и уравнивание потенциалов считаем по этому стандарту.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/gost/details/1d21baf2-ecc8-4434-81c0-fff014792783" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">СП 155.13130.2014</span>
<h4 class="doc-card__name">Склады нефти и нефтепродуктов. Требования пожарной безопасности</h4>  <p class="panel__meta mt-3">Обвалование, пожарные проезды и расстановка резервуаров: защитные конструкции не должны нарушать эти требования.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/sp/details/743ae79f-898c-4501-97f8-c7d02a3cd709" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">СП 2.13130.2020</span>
<h4 class="doc-card__name">Системы противопожарной защиты. Обеспечение огнестойкости объектов защиты</h4>  <p class="panel__meta mt-3">Предел огнестойкости и класс конструктивной пожарной опасности: учитываем в узлах, которые проходят через противопожарные преграды.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/sp/details/90783c81-7eaa-4b90-b774-55ad27e6dfa1" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ГОСТ 30826-2014</span>
<h4 class="doc-card__name">Стекло многослойное. Технические условия</h4>  <p class="panel__meta mt-3">Классы защиты многослойного стекла: учитываем при защите витражей и окон, в том числе при оценке ударной стойкости остекления.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/gost/details/554770cd-bce1-4b31-b6bd-fcf89d614795" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ГОСТ 9.307-2021</span>
<h4 class="doc-card__name">Единая система защиты от коррозии и старения. Покрытия цинковые горячие. Общие требования и методы контроля</h4>  <p class="panel__meta mt-3">Коррозионная стойкость и срок службы металлоконструкций: по нему назначаем горячее цинкование каркаса, кронштейнов и крепежа.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/gost/details/1c99d164-b92d-4b1b-824c-ef8dde1c714a" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ГОСТ Р 56027-2014</span>
<h4 class="doc-card__name">Материалы строительные. Метод испытаний на возгораемость под воздействием малого пламени</h4>  <p class="panel__meta mt-3">Возгораемость материала полотна: по этой методике подтверждаем пожарные характеристики сетки, включая FR-исполнение.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="https://protect.gost.ru/gost/details/e2a66a8c-add4-45c3-ab2e-58c05827d778" target="_blank" rel="noopener"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>Скачать документ</a>
    <span class="doc-card__src">ФГИС Росстандарта</span>
  </div>
</article>        </div>
      </section>
      <section id="normativy-panel-industry" class="tabs__panel" role="tabpanel" aria-labelledby="normativy-tab-industry">
        <div class="docpanel__head">
          <h3 class="docpanel__title">Отраслевые и ведомственные документы</h3>
          <span class="docpanel__count">2</span>
        </div>
        <p class="docpanel__note">Применяем вместе с базовыми нормами: они уточняют требования на действующем объекте.</p>
        <div class="docgrid">
<article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">ПУЭ</span>
<h4 class="doc-card__name">Правила устройства электроустановок</h4>  <p class="panel__meta mt-3">Мёртвая зона, заземление и безопасные расстояния до токоведущих частей на действующих объектах: задают геометрию и допуски монтажа.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>Запросить редакцию</a>
    <span class="doc-card__src">вышлем с расчётом</span>
  </div>
</article><article class="panel doc-card p-6 reveal">
  <span class="doc-card__code">Рекомендации МЧС</span>
<h4 class="doc-card__name">Методические рекомендации по защите объектов от беспилотных летательных аппаратов</h4>  <p class="panel__meta mt-3">Используем при разработке паспорта безопасности и регламента действий: они увязывают инженерную защиту с организационными мерами.</p>
  <div class="doc-card__foot">
    <a class="btn btn--ghost btn--sm" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>Запросить редакцию</a>
    <span class="doc-card__src">вышлем с расчётом</span>
  </div>
</article>        </div>
      </section>
    </div>
  </div>
<p class="note mt-6 border-l-2 px-4 py-3 text-sm border-volt/60 bg-volt/5">Состав норм по вашему объекту может быть шире: отраслевые и ведомственные требования зависят от категории объекта. Пришлём перечень с редакциями и примечаниями вместе с расчётом.</p></div>
  
</section>
  
<section id="praktika" class="band flame-band">
  <div class="shell">  <div class="practice-split">
    <div class="practice-intro">
      <span class="kicker">Патентная чистота и согласования</span>
      
      <h2 class="h3 mt-4">Доводим решение до документов, которые проходит экспертиза</h2>
      <p class="lead mt-4">Инженерное решение стоит ровно столько, сколько его можно предъявить. Поэтому работаем не только с расчётом и монтажом, но и с бумагой: патенты, согласования, государственная экспертиза, тендерная и приёмочная документация.</p>
<p class="note practice-intro__note">Опыт подтверждаем предъявимо: референс-лист, протоколы испытаний и сведения о правообладателях направляем по запросу в составе предложения и тендерной документации.</p>    </div>
    <ol class="panel panel--practice practice-sheet">
      <li class="practice reveal">
        <span class="practice__num">01</span>
        <div class="practice__body">
          <div class="practice__head">
            <svg class="h-5 w-5 practice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg>
            <h3 class="practice__title">Патентная чистота решений</h3>
          </div>
          <p class="practice__text">Перед выдачей решения проверяем патентную ситуацию: не нарушает ли узел действующие патенты и не попадает ли в охраняемый объём. Чужие разработки не присваиваем: там, где изделие поставляет другой изготовитель, правообладателя указываем по его документации.</p>
        </div>
      </li>
      <li class="practice reveal">
        <span class="practice__num">02</span>
        <div class="practice__body">
          <div class="practice__head">
            <svg class="h-5 w-5 practice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg>
            <h3 class="practice__title">Документы под государственную экспертизу</h3>
          </div>
          <p class="practice__text">Комплект собираем так, чтобы его приняли на проверке: расчёт с расчётными сценариями, обоснование выбора материалов и уровня защиты, сертификаты, протоколы испытаний, исполнительная документация. Требования экспертизы и надзора учитываем на этапе проектирования, а не после замечаний.</p>
        </div>
      </li>
      <li class="practice reveal">
        <span class="practice__num">03</span>
        <div class="practice__body">
          <div class="practice__head">
            <svg class="h-5 w-5 practice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5.5" width="19" height="13" rx="1.5"/><path d="M2.5 10h19"/><path d="M6 14.5h4"/></svg>
            <h3 class="practice__title">Государственные заказчики и закупки</h3>
          </div>
          <p class="practice__text">Работаем с государственными заказчиками по 44-ФЗ и 223-ФЗ: готовим техническую часть и обоснования под конкурсную документацию, помогаем заказчику сформулировать проверяемые требования, чтобы к поставке не прошли решения без расчёта.</p>
        </div>
      </li>
      <li class="practice reveal">
        <span class="practice__num">04</span>
        <div class="practice__body">
          <div class="practice__head">
            <svg class="h-5 w-5 practice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 21 12 3l4 18"/><path d="M6.4 15h11.2M9.2 9h5.6"/><path d="M6 21h12"/></svg>
            <h3 class="practice__title">Допуск на объект и ведомственные требования</h3>
          </div>
          <p class="practice__text">Учитываем внутренние регламенты эксплуатирующих организаций: паспорт безопасности объекта, порядок допуска подрядчика, работу по наряду-допуску и в окна режима. Так решение проходит согласование служб объекта, а не остаётся на бумаге.</p>
        </div>
      </li>
    </ol>
  </div>
</div>
  
</section>
  
<section id="dokumentaciya" class="band grid-bg">
  <div class="shell">  <span class="kicker">Результат работы</span><h2 class="h2 mt-4">Что заказчик получает по итогам проектирования</h2><p class="lead mt-4 max-w-4xl">Комплект документов готовим в объёме, достаточном для закупки, монтажа, эксплуатации и предъявления проверяющим.</p>
  <div class="mt-8">
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Проект защиты объекта: схемы, узлы, рабочие чертежи, спецификация материалов</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Расчёты нагрузок, опор, анкеровки и прогиба полотна с исходными данными</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Схемы заземления и молниезащиты, решения по безопасным расстояниям</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Паспорт изделия и инструкция по эксплуатации конструкции</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Регламент осмотров и обслуживания с периодичностью и перечнем работ</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Протоколы испытаний и сертификаты материалов — по запросу</span></div>
  <div class="docrow"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/><path d="M9 12.5h6M9 16h4"/></svg><span class="text-sm text-mist">Комплект для тендера: объёмы, технические формулировки, обоснования выбора материалов</span></div>
</div>
</div>
  
</section>
  
  

<section id="cta" class="cta-band band">
  <div class="shell cta-band__inner">
    <div class="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end">
      <div>
        <span class="kicker">Расчёт по объекту</span>
        <h2 class="h2 mt-4">Пришлите данные по объекту — посчитаем схему защиты</h2>
        <p class="mt-4 max-w-2xl text-[#2b1a10]">Достаточно типа объекта, критичных узлов, размеров и фотографий. Инженер предложит конструкцию, уровень защиты по СП 542 и ориентир по стоимости, а после обследования — предложение по спецификации.</p>
      </div>
      <div class="lg:text-right">
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <a class="btn btn--ink" href="#zayavka"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"/></svg>Оставить заявку</a>
          <a class="btn btn--ink" href="tel:+74993760000">8 (499) 376-00-00</a>
        </div>
      </div>
    </div>
    
    <p class="cta-key"><svg class="cta-key__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"/><path d="m9 12.2 2.2 2.3 4.3-4.5"/></svg><span>Работаем по договору: обследование, проект, изготовление, монтаж и документация — <strong class="cta-key__hi">один подрядчик на весь комплекс</strong>.</span></p>
  </div>
</section>
  
<section id="tendery" class="band on-light">
  <div class="shell">  <span class="kicker">Тендеры и госпредприятия</span><h2 class="h2 mt-4">Готовим документацию для ЭТП, 44-ФЗ и 223-ФЗ</h2><p class="lead mt-4 max-w-4xl">Работаем с закупками сетевых, генерирующих и промышленных компаний: помогаем заказчику сформировать технические требования так, чтобы к поставке не прошли «видимые» решения без расчёта.</p>
  <ul class="tick mt-7">
<li>Техническое задание и обоснование требований к конструкции</li><li>Расчёт и спецификация как приложение к закупочной документации</li><li>Референс-лист и протоколы испытаний по запросу</li><li>Документы для подтверждения опыта: акты, отзывы, паспорта изделий</li></ul>
</div>
  <div class="deco deco--seal deco--br" aria-hidden="true">
  
  <span class="deco__seal"><span class="deco__rings" aria-hidden="true"><i class="deco__ring deco__ring--near" /><i class="deco__ring deco__ring--far" /><i class="deco__ring-dot" /></span><svg class="deco__seal-svg" viewBox="0 0 132 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  
  <path class="deco__seal-line" d="M24 8h66l26 26v108a16 16 0 0 1-16 16H24a16 16 0 0 1-16-16V24a16 16 0 0 1 16-16Z"/>
  
  <path class="deco__seal-line" d="M90 8c0 12 1 18 6 22 5 4 12 4 20 4"/>
  
  <path class="deco__seal-line" d="M28 58h70M28 78h64M28 98h58M28 118h20"/>
  
  <circle class="deco__seal-ring" cx="85" cy="132" r="30"/>
  <circle class="deco__seal-ring" cx="85" cy="132" r="19"/>
  <path class="deco__seal-check" d="M72 132l7.5 7.5 20-14.8"/>
</svg></span>
<span class="deco__ticks"><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /><i class="deco__tick" /></span></div>

</section>
  
<section id="ceny" class="band grid-bg">
  <div class="shell">  <span class="kicker">Ориентиры</span><h2 class="h2 mt-4">Стоимость по направлениям</h2><p class="lead mt-4 max-w-4xl">Таблицы ниже собраны из данных тематических страниц: цены на материалы и комплекс работ по каждому типу объекта. Все цифры — ориентир для бюджета «зависит от объекта».</p>
  <div class="tabs mt-10" data-tabs>
    <div class="tabs__list" role="tablist" aria-label="Направления защиты">
      <button id="ceny-tab-mosty" type="button" class="tabs__tab" role="tab" aria-controls="ceny-panel-mosty">Мосты и путепроводы</button>
      <button id="ceny-tab-npz" type="button" class="tabs__tab" role="tab" aria-controls="ceny-panel-npz">НПЗ, нефтебазы, АЗС</button>
      <button id="ceny-tab-podstancii" type="button" class="tabs__tab" role="tab" aria-controls="ceny-panel-podstancii">Подстанции и ОРУ</button>
      <button id="ceny-tab-zdaniya" type="button" class="tabs__tab" role="tab" aria-controls="ceny-panel-zdaniya">Здания и склады</button>
      <button id="ceny-tab-okna" type="button" class="tabs__tab" role="tab" aria-controls="ceny-panel-okna">Окна и остекление</button>
    </div>
    <div class="tabs__panels">
      <section id="ceny-panel-mosty" class="tabs__panel" role="tabpanel" aria-labelledby="ceny-tab-mosty">
        <p class="lead">Цифры ниже — ориентир для планирования. Точная стоимость рассчитывается после обследования, потому что зависит от габарита, узлов и условий монтажа.</p>
<div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Состав</th><th scope="col">Ориентир</th></tr></thead>
    <tbody>
      <tr><td>Материалы: полотна, сетка, тросы, крепёж</td><td>от 370 до 2 600 ₽/м²</td></tr>
      <tr><td>Полный комплекс: обследование, проект, изготовление, монтаж</td><td>от 2 500 ₽/м²</td></tr>
    </tbody>
  </table>
</div><p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">В расчёт включаем обследование, проект, изготовление, поставку, монтаж и документацию. Работы, требующие согласования с балансодержателем сооружения, выделяем отдельной строкой.</p>        <div class="mt-6">
          <a class="btn btn--ghost" href="./mosty.html#zayavka">Расчёт по этому направлению<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
        </div>
      </section>
      <section id="ceny-panel-npz" class="tabs__panel" role="tabpanel" aria-labelledby="ceny-tab-npz">
        <p class="lead">Ниже — ориентиры для планирования бюджета. Точная стоимость определяется после обследования: она зависит от типа и объёма резервуаров, класса взрывопожароопасности, уровня защиты и условий монтажа.</p>
<div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Этап или элемент</th><th scope="col">Ориентир</th></tr></thead>
    <tbody>
      <tr><td>Защита под ключ: обследование, проект, каркас, полотно, монтаж</td><td>от 6 000 до 6 500 ₽/м²</td></tr>
      <tr><td>Поставка полотна без монтажа</td><td>от 200 до 550 ₽/м²</td></tr>
      <tr><td>Монтаж полотна на готовый каркас</td><td>от 450 ₽/м²</td></tr>
      <tr><td>Проектирование ЗОК по СП 542</td><td>от 350 000 ₽</td></tr>
      <tr><td>Проект КМ и КМД</td><td>от 150 000 ₽</td></tr>
      <tr><td>Выезд инженера на объект</td><td>от 18 000 ₽ за смену</td></tr>
      <tr><td>Эскизное решение или 3D-визуализация</td><td>от 45 000 ₽</td></tr>
    </tbody>
  </table>
</div><p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">В стоимость включаем обследование, проектирование, изготовление, поставку, монтаж и документацию. Работы, требующие вывода оборудования или плановых окон, оцениваем отдельно.</p>        <div class="mt-6">
          <a class="btn btn--ghost" href="./npz.html#zayavka">Расчёт по этому направлению<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
        </div>
      </section>
      <section id="ceny-panel-podstancii" class="tabs__panel" role="tabpanel" aria-labelledby="ceny-tab-podstancii">
        <p class="lead">Ниже — ориентиры для планирования бюджета. Точная стоимость определяется после обследования: она зависит от класса напряжения, состава защищаемых узлов, уровня защиты и режимных ограничений.</p>
<div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Этап или элемент</th><th scope="col">Ориентир</th></tr></thead>
    <tbody>
      <tr><td>Защита под ключ: обследование, проект, каркас, полотно, монтаж</td><td>от 6 000 до 6 500 ₽/м²</td></tr>
      <tr><td>Поставка полотна без монтажа</td><td>от 200 до 550 ₽/м²</td></tr>
      <tr><td>Монтаж полотна на готовый каркас</td><td>от 450 ₽/м²</td></tr>
      <tr><td>Проектирование ЗОК по СП 542</td><td>от 350 000 ₽</td></tr>
      <tr><td>Проект КМ и КМД</td><td>от 150 000 ₽</td></tr>
      <tr><td>Выезд инженера на объект</td><td>от 18 000 ₽ за смену</td></tr>
      <tr><td>Эскизное решение или 3D-визуализация</td><td>от 45 000 ₽</td></tr>
    </tbody>
  </table>
</div><p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">В стоимость включаем обследование, проектирование, изготовление, поставку, монтаж и документацию. Работы, требующие вывода оборудования, оцениваем отдельно по согласованному графику.</p>        <div class="mt-6">
          <a class="btn btn--ghost" href="./podstancii.html#zayavka">Расчёт по этому направлению<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
        </div>
      </section>
      <section id="ceny-panel-zdaniya" class="tabs__panel" role="tabpanel" aria-labelledby="ceny-tab-zdaniya">
        <p class="lead">Ниже — ориентиры для планирования бюджета. Точная стоимость определяется после обследования: она зависит от площади и высоты остекления, типа стеклопакета, этажности и условий монтажа.</p>
<div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Этап или элемент</th><th scope="col">Ориентир</th></tr></thead>
    <tbody>
      <tr><td>Защита под ключ: обследование, проект, каркас, полотно, монтаж</td><td>от 4 500 до 6 500 ₽/м²</td></tr>
      <tr><td>Фасадный экран на остекление: полиамид 20×20 мм с кронштейнами</td><td>от 1 500 ₽/м²</td></tr>
      <tr><td>Полиамидная сетка 20×20 мм (материал)</td><td>от 293 ₽/м²</td></tr>
      <tr><td>FR-антипирен 20×20 мм (материал)</td><td>от 384 ₽/м²</td></tr>
      <tr><td>Арамидная сетка 30×30 мм (материал)</td><td>от 732 ₽/м²</td></tr>
      <tr><td>Монтаж сетки на готовый каркас</td><td>от 450 ₽/м²</td></tr>
      <tr><td>Проектирование ЗОК по СП 542</td><td>от 150 000 ₽</td></tr>
      <tr><td>Эскизное решение или 3D-визуализация</td><td>от 45 000 ₽</td></tr>
      <tr><td>Выезд инженера на объект</td><td>от 18 000 ₽ за смену</td></tr>
    </tbody>
  </table>
</div><p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">Минимальную стоимость работ и минимальную стоимость заказа уточняем при обращении: она зависит от объёма и от того, требуется ли выезд на объект.</p>        <div class="mt-6">
          <a class="btn btn--ghost" href="./zdaniya.html#zayavka">Расчёт по этому направлению<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
        </div>
      </section>
      <section id="ceny-panel-okna" class="tabs__panel" role="tabpanel" aria-labelledby="ceny-tab-okna">
        <p class="lead">Цифры ниже — ориентир для планирования; точная стоимость считается после замера проёмов и зависит от площади остекления, высоты, типа стеклопакета и условий монтажа.</p>
<div class="table-scroll mt-8">
  <table class="tbl">
    <thead><tr><th scope="col">Состав</th><th scope="col">Ориентир</th></tr></thead>
    <tbody>
      <tr><td>Защита под ключ: обследование, проект, каркас, полотно, монтаж</td><td>от 4 500–6 500 ₽/м²</td></tr>
      <tr><td>Фасадный экран на остекление: сетка 20×20 мм с кронштейнами</td><td>от 1 500 ₽/м²</td></tr>
      <tr><td>Полиамидная сетка 20×20 мм (материал)</td><td>от 293 ₽/м²</td></tr>
      <tr><td>Сетка FR-антипирен 20×20 мм (материал)</td><td>от 384 ₽/м²</td></tr>
      <tr><td>Арамидная сетка 30×30 мм (материал)</td><td>от 732 ₽/м²</td></tr>
      <tr><td>Монтаж сетки на готовый каркас</td><td>от 450 ₽/м²</td></tr>
      <tr><td>Проектирование ЗОК по СП 542</td><td>от 150 000 ₽</td></tr>
      <tr><td>Эскизное решение и 3D-визуализация</td><td>от 45 000 ₽</td></tr>
      <tr><td>Выезд инженера на объект</td><td>от 18 000 ₽/смена</td></tr>
    </tbody>
  </table>
</div><p class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5">Минимальную стоимость работ и минимальную стоимость заказа согласуем после замера: эти цифры зависят от объекта и объёма доступа. В расчёт включаем обследование, проект, изготовление, поставку, монтаж и документацию.</p>        <div class="mt-6">
          <a class="btn btn--ghost" href="./okna.html#zayavka">Расчёт по этому направлению<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
        </div>
      </section>
    </div>
  </div>
  <p class="note mt-6 border-l-2 px-4 py-3 text-sm border-volt/60 bg-volt/5">Диапазоны цен приведены по документации и материалам технического задания. Точная стоимость — после обследования и по спецификации.</p>
</div>
  
</section>
  

<section id="zayavka" class="band band--stars">
  
  <div class="stars-bg" aria-hidden="true">
    <div class="stars stars--far" />
    <div class="stars stars--mid" />
    <div class="stars stars--near" />
    <div class="stars stars--spark" />
    
    <div class="stars stars--giant" />
  </div>
  <div class="shell grid gap-10 lg:grid-cols-[1fr_minmax(0,430px)] lg:items-start lg:gap-14">
    <div>
      <span class="kicker">Обратная связь</span>
      <h2 class="h2 mt-4">Заявка на расчёт</h2>

      
      <ul class="mt-9 space-y-4 text-base md:text-lg">
        <li><a class="inline-flex items-center gap-4 font-medium text-snow transition-colors hover:text-flame" href="tel:+74993760000"><svg class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"/></svg>8 (499) 376-00-00</a></li>
        <li><a class="inline-flex items-center gap-4 font-medium text-snow transition-colors hover:text-flame" href="mailto:zakaz@zok.pro"><svg class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>zakaz@zok.pro</a></li>
        <li class="flex items-center gap-4 text-mist"><svg class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/></svg>Пн–Пт, 09:00–19:00 (МСК)</li>
        <li class="flex items-center gap-4 text-mist"><svg class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.4"/></svg>Работаем по всей России</li>
      </ul>
    </div>

    <form class="panel panel--accent panel--form p-5 md:p-6" method="post" action="mailto:zakaz@zok.pro" enctype="text/plain" data-form data-form-slug="index">
      
      <input type="hidden" name="Раздел" value="Главная">

      <div class="grid gap-4">
<div class="field">
  <label for="f-name">Имя</label>
  <input id="f-name" name="name" type="text" placeholder="Как к вам обращаться" required autocomplete="name">
</div>
<div class="field">
  <label for="f-phone">Телефон</label>
  <input id="f-phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" required autocomplete="tel">
</div>
        <div class="field">
  <label for="f-comment">Комментарий</label>
  <textarea id="f-comment" name="comment" rows="3" placeholder="Объект, критичные узлы, сроки — коротко" />
</div>

      </div>

      <p class="form-status mt-4" data-form-status data-form-error="Проверьте поля, отмеченные красным, и попробуйте снова." role="status" aria-live="polite">Заявка проверена и готова к отправке: инженер свяжется с вами в рабочее время в течение 1 рабочего дня.</p>

      <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button class="btn btn--primary btn--wide" type="submit">Отправить заявку<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></button>
        <span class="form-note max-w-[22rem]">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</span>
      </div>
    </form>
  </div>
</section>
  </main>
  <footer class="site-footer">
  <div class="shell">
    
    <div class="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
      <div>
        <a class="brand" href="/">
  <svg class="brand__mark" viewBox="0 0 104 137" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M0 35.5L28 17.5V129.5L0 122Z"/>
    <path fill="currentColor" d="M36 11.7L52 0L68 7.1V125.3L52 137L36 129.9Z"/>
    <path class="brand__mark-accent" d="M76 7.5L104 15V101.5L76 119.5Z"/>
  </svg>
  <span>
    <span class="brand__name">форт<span class="brand__accent">Тех</span></span>
    <span class="brand__tag">защита от БПЛА</span>
  </span>
</a>
        <p class="mt-5 max-w-sm text-sm text-mist">Проектирование, изготовление и монтаж защитных конструкций от БПЛА: вынесенный рубеж вокруг объекта и локальная противоосколочная защита оборудования.</p>
        <ul class="mt-6 space-y-2">
          <li><a class="inline-flex items-center gap-2" href="tel:+74993760000"><svg class="h-4 w-4 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"/></svg>8 (499) 376-00-00</a></li>
          <li><a class="inline-flex items-center gap-2" href="mailto:zakaz@zok.pro"><svg class="h-4 w-4 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>zakaz@zok.pro</a></li>
          <li class="inline-flex items-center gap-2 text-sm text-mist"><svg class="h-4 w-4 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/></svg>Пн–Пт, 09:00–19:00 (МСК)</li>
          <li class="inline-flex items-center gap-2 text-sm text-mist"><svg class="h-4 w-4 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.4"/></svg>Россия, выезд инженера на объект по всей стране</li>
        </ul>
      </div>

      <div>
        <h3>Направления</h3>
        <ul class="space-y-2">
          <li><a href="./mosty.html">Мосты и путепроводы</a></li>
          <li><a href="./npz.html">НПЗ, нефтебазы, АЗС</a></li>
          <li><a href="./podstancii.html">Подстанции и ОРУ</a></li>
          <li><a href="./zdaniya.html">Здания и склады</a></li>
          <li><a href="./okna.html">Окна и остекление</a></li>
        </ul>
      </div>
      <div>
        <h3>Решения и материалы</h3>
        <ul class="space-y-2">
          <li><a href="./konstrukcii.html">Конструкции и материалы</a></li>
          <li><a href="./zpb.html">Противоосколочные блоки</a></li>
          <li><a href="./proektirovanie.html">Проектирование и документы</a></li>
        </ul>
      </div>
      <div>
        <h3>Расчёт и заявка</h3>
        <ul class="space-y-2">
          <li><a href="./ceny.html">Стоимость</a></li>
          <li><a href="./kontakty.html">Контакты и заявка</a></li>
        </ul>
      </div>

      
      <div>
        <h3>Компания</h3>
        <ul class="space-y-2">
          <li><a href="./o-kompanii.html">О компании</a></li>
        </ul>
      </div>
    </div>

    <div class="mt-12 border-t border-line pt-6">
      <p class="fnote max-w-4xl">фортТех — подрядчик по обследованию, расчёту, проектированию, изготовлению, поставке и монтажу защитных конструкций. Технические характеристики изделий и материалов приводятся по документации изготовителей и протоколам испытаний. Защита от БПЛА — элемент комплексной безопасности и не заменяет организационные, противопожарные и иные меры.</p>
      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p class="fnote">© 2026 фортТех · Инженерная защита объектов от БПЛА</p>
        <a class="btn btn--ghost" href="./kontakty.html#zayavka">Запросить расчёт<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg></a>
      </div>
    </div>
  </div>
</footer>
</div>
</template>
