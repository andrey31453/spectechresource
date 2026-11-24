<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { HomeDto, SiteDto } from "~/types/catalog";
import { categoryPath } from "~/utils/routes";
import { telHref } from "~/utils/phone";

type ExperimentalVariant = "light" | "dark" | "editorial";

const props = defineProps<{ variant: ExperimentalVariant; embedded?: boolean }>();
const emit = defineEmits<{ activate: [] }>();

const { data: site } = await useSite();
const { data: home } = await useAsyncData<HomeDto>(
  `home-experimental-${props.variant}`,
  () => $fetch<HomeDto>("/api/home"),
  {
    default: () => ({
      categories: [], models: [], services: [], advantages: [], steps: [], stats: [], faq: [],
    }),
  },
);

const fallbackSite: SiteDto = {
  companyName: "ООО «СПЕЦТЕХРЕСУРС»",
  phone: "+7 (495) 000-00-00",
  email: null,
  telegram: null,
  whatsapp: null,
  maxMessenger: null,
  workingHours: "Пн–Вс, 08:00–20:00",
  address: null,
  mapLat: null,
  mapLng: null,
  legalName: null,
  inn: null,
  ogrn: null,
  legalAddress: null,
  priceDisclaimer: "",
  metrikaId: null,
  city: { slug: "moskva", name: "Москва", nameIn: "Москве" },
};

const siteInfo = computed(() => site.value ?? fallbackSite);
const categories = computed(() => home.value?.categories.slice(0, 4) ?? []);
const active = ref(false);
const reduceMotion = ref(false);
const hero = ref<HTMLElement | null>(null);

const fallbackImages = [
  "/landing/images/tech/hero.webp",
  "/landing/images/tech/park.webp",
  "/landing/images/tech/podacha.webp",
  "/landing/images/tech/na-obekte.webp",
];

const categoryCards = computed(() =>
  categories.value.map((category, index) => ({
    ...category,
    image: category.image || fallbackImages[index],
    number: String(index + 1).padStart(2, "0"),
    icon: ["excavator", "truck", "crane", "roller"][index] ?? "gear",
  })),
);

function categoryTitle(title: string) {
  const [first, ...rest] = title.split(" ");
  return { first, rest: rest.join(" ") };
}

function reveal() {
  if (active.value) return;
  active.value = true;
  emit("activate");
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === "mouse") reveal();
}

function onClick() {
  if (props.variant === "dark") reveal();
}

function onKeydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLElement && ["A", "BUTTON", "INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    reveal();
  }
}

onMounted(() => {
  reduceMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion.value) reveal();
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <component :is="embedded ? 'div' : 'main'" ref="hero" class="experimental" :class="[`experimental--${variant}`, { 'is-active': active, 'min-h-0!': embedded }]" @click.once="onClick">
    <div class="experimental__backdrop" aria-hidden="true" />

    <header v-if="!embedded" class="experimental__header">
      <a href="/" class="experimental__brand" aria-label="На главную">
        <span>{{ siteInfo.companyName.replace(/^ООО\s+/, "") }}</span>
        <small>аренда спецтехники</small>
      </a>
      <nav aria-label="Навигация экспериментальной страницы">
        <a href="#categories">Категории</a>
        <a href="/katalog">Весь каталог</a>
        <a :href="telHref(siteInfo.phone)" class="experimental__phone">{{ siteInfo.phone }}</a>
      </nav>
      <a href="/#zayavka" class="experimental__header-cta">Подобрать технику <span>↗</span></a>
    </header>

    <section class="experimental__hero" :class="{ 'min-h-dvh!': embedded && !active }" aria-labelledby="experimental-title">
      <div class="experimental__hero-copy">
        <p class="experimental__eyebrow">Спецтехника для задач, которые нельзя отложить</p>
        <h1 id="experimental-title">Аренда<br><em>спецтехники</em></h1>
        <ul v-if="variant === 'dark'" class="experimental__benefits m-0 mt-8 grid w-max list-none gap-3 p-0 text-[clamp(20px,2.2vw,28px)] leading-tight font-semibold text-[#f2eee6]">
          <li v-for="benefit in ['Машины с экипажем', 'Полный пакет документов', 'Подача к началу работ']" :key="benefit" class="flex items-center gap-3 whitespace-nowrap">
            <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-[#f08a3c]" />
            {{ benefit }}
          </li>
        </ul>
        <p v-else class="experimental__lead">Машины с экипажем. Подача точно к началу работ.</p>
        <button class="experimental__start" :class="{ 'min-h-11': embedded }" type="button" @click="reveal">
          <span class="experimental__start-dot" />
          Двигайте курсор, чтобы смотреть парк
        </button>
      </div>
      <div class="experimental__hero-stamp" aria-hidden="true">
        <span>СПЕЦТЕХ</span><strong>01</strong><span>МОСКВА / МО</span>
      </div>
      <div class="experimental__hero-machines" aria-hidden="true">
        <div v-for="category in categoryCards" :key="`hero-${category.slug}`" class="experimental__hero-machine">
          <img :src="category.image" alt="">
          <span v-if="variant !== 'dark'">{{ category.number }} / {{ category.title }}</span>
        </div>
      </div>
      <div class="experimental__hero-lines" aria-hidden="true" />
    </section>

    <section id="categories" class="experimental__categories" :aria-labelledby="variant !== 'dark' ? 'categories-title' : undefined" :aria-label="variant === 'dark' ? 'Направления техники' : undefined">
      <div v-if="variant !== 'dark'" class="experimental__section-head">
        <div>
          <p class="experimental__eyebrow">Каталог / 01—04</p>
          <h2 id="categories-title">Выберите направление</h2>
        </div>
        <p>Четыре направления техники<br>для разных задач на объекте</p>
      </div>
      <div class="experimental__grid" :class="{ 'experimental__grid--banner': variant === 'dark' }">
        <component
          :is="variant === 'dark' ? 'div' : 'a'"
          v-for="category in categoryCards"
          :key="category.slug"
          class="experimental__card"
          :href="variant !== 'dark' ? categoryPath(category.slug) : undefined"
        >
          <div class="experimental__card-image">
            <img :src="category.image" :alt="category.title" loading="lazy">
          </div>
          <div v-if="variant !== 'dark'" class="experimental__card-content">
            <span class="experimental__card-number">{{ category.number }}</span>
            <h3>{{ category.title }}</h3>
            <p>{{ category.shortDesc || "Техника для работы на объекте" }}</p>
            <span class="experimental__card-arrow" aria-hidden="true">↗</span>
          </div>
          <span v-if="variant === 'dark'" class="experimental__banner-icon" aria-hidden="true"><SiteIcon :name="category.icon" :stroke-width="1" /></span>
          <div v-if="variant === 'dark'" class="experimental__banner-label">
            <span class="experimental__banner-number" aria-hidden="true">{{ category.number }}</span>
            <h3>
              <span>{{ categoryTitle(category.title).first }}</span>
              {{ categoryTitle(category.title).rest }}
            </h3>
          </div>
        </component>
      </div>
    </section>

    <footer v-if="!embedded" class="experimental__footer">
      <a href="/" class="experimental__brand">{{ siteInfo.companyName }}</a>
      <span>Экспериментальная витрина · {{ variant }}</span>
      <a href="/katalog">Открыть весь каталог ↗</a>
    </footer>
  </component>
</template>

<style scoped>
.experimental {
  --exp-bg: #eeeae2;
  --exp-ink: #151817;
  --exp-muted: #68706d;
  --exp-accent: #e87832;
  min-height: 100svh;
  overflow: hidden;
  background: var(--exp-bg);
  color: var(--exp-ink);
  font-family: Arial, sans-serif;
}
.experimental__header { position: fixed; z-index: 10; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px clamp(20px, 4vw, 64px); transform: translateY(-110%); border-bottom: 1px solid rgb(21 24 23 / 12%); background: color-mix(in srgb, var(--exp-bg) 88%, transparent); backdrop-filter: blur(14px); transition: transform .7s cubic-bezier(.22,1,.36,1); }
.is-active .experimental__header { transform: translateY(0); }
.experimental__brand { display: flex; flex-direction: column; color: inherit; font-size: 15px; font-weight: 800; letter-spacing: -.04em; text-decoration: none; text-transform: uppercase; }
.experimental__brand small { margin-top: 3px; color: var(--exp-muted); font-size: 9px; font-weight: 500; letter-spacing: .1em; text-transform: none; }
.experimental__header nav { display: flex; align-items: center; gap: clamp(16px, 3vw, 44px); font-size: 12px; font-weight: 700; text-transform: uppercase; }
.experimental__header nav a, .experimental__header-cta { color: inherit; text-decoration: none; }
.experimental__phone { color: var(--exp-muted) !important; }
.experimental__header-cta { padding: 12px 16px; border: 1px solid currentColor; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.experimental__header-cta span { margin-left: 10px; color: var(--exp-accent); font-size: 16px; }
.experimental__hero { position: relative; display: flex; min-height: 100svh; align-items: center; padding: 12vh clamp(20px, 10vw, 160px); transition: min-height .95s cubic-bezier(.22,1,.36,1), padding .95s cubic-bezier(.22,1,.36,1); }
.is-active .experimental__hero { min-height: 34svh; padding-top: 120px; padding-bottom: 38px; }
.experimental--dark.is-active .experimental__hero { min-height: 30.6svh; padding-top: 108px; padding-bottom: 34px; }
.experimental--dark.is-active h1 { font-size: clamp(40px, 6vw, 96px); }
.experimental--dark.is-active .experimental__eyebrow { margin-bottom: 20px; }
.experimental--dark.is-active .experimental__lead { margin-top: 27px; }
.experimental--dark.is-active .experimental__start { display: none; }
.experimental__hero-copy { position: relative; z-index: 1; max-width: 900px; }
.experimental__eyebrow { margin: 0 0 26px; color: var(--exp-muted); font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.experimental h1 { margin: 0; font-size: clamp(64px, 12vw, 190px); font-weight: 800; letter-spacing: -.09em; line-height: .78; text-transform: uppercase; }
.experimental h1 em { color: var(--exp-accent); font-style: normal; }
.experimental__lead { max-width: 370px; margin: 34px 0 0; color: var(--exp-muted); font-size: clamp(16px, 1.5vw, 22px); line-height: 1.35; }
.experimental__start { display: flex; align-items: center; gap: 12px; margin-top: 44px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
.experimental__start-dot { width: 12px; height: 12px; border-radius: 999px; background: var(--exp-accent); box-shadow: 0 0 0 7px color-mix(in srgb, var(--exp-accent) 18%, transparent); }
.is-active .experimental__start { opacity: 0; pointer-events: none; }
.experimental__hero-stamp { position: absolute; right: clamp(20px, 8vw, 120px); bottom: 12%; display: grid; gap: 8px; color: var(--exp-muted); font-size: 9px; letter-spacing: .12em; text-align: right; }
.experimental__hero-stamp strong { color: var(--exp-accent); font-size: clamp(80px, 13vw, 180px); letter-spacing: -.1em; line-height: .75; }
.experimental__hero-machines { position: absolute; right: clamp(20px, 8vw, 120px); bottom: 10%; display: flex; width: min(48vw, 680px); height: 44%; gap: 8px; transform: translateY(20px); opacity: .9; transition: opacity .7s ease, transform .9s cubic-bezier(.22,1,.36,1); }
.experimental__hero-machine { position: relative; flex: 1; min-width: 0; overflow: hidden; border-radius: 2px; background: #b8b5ad; }
.experimental__hero-machine:nth-child(2) { transform: translateY(34px); }
.experimental__hero-machine:nth-child(3) { transform: translateY(12px); }
.experimental__hero-machine img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.7) contrast(1.08); transition: transform .8s ease; }
.experimental__hero-machine span { position: absolute; right: 8px; bottom: 8px; left: 8px; color: white; font-size: 8px; font-weight: 700; letter-spacing: .08em; text-shadow: 0 1px 5px #000; text-transform: uppercase; }
.is-active .experimental__hero-machines { transform: translateY(0); opacity: .16; }
.experimental--dark.is-active .experimental__hero-machines { right: 2vw; bottom: 6%; width: 58vw; height: 72%; opacity: .32; }
.experimental__hero-lines { position: absolute; right: 0; bottom: 0; width: 44%; height: 75%; opacity: .4; background: repeating-linear-gradient(135deg, transparent 0 42px, currentColor 43px 44px); mask-image: linear-gradient(to left, black, transparent); }
.experimental__categories { position: relative; max-width: 1440px; margin: 0 auto; padding: 70px clamp(20px, 4vw, 64px) 110px; }
.experimental__section-head { display: flex; align-items: end; justify-content: space-between; gap: 32px; margin-bottom: 30px; }
.experimental__section-head h2 { margin: 0; font-size: clamp(34px, 5vw, 72px); letter-spacing: -.07em; line-height: .9; }
.experimental__section-head > p { margin: 0; color: var(--exp-muted); font-size: 13px; line-height: 1.4; text-align: right; }
.experimental__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.experimental__card { position: relative; min-height: 430px; overflow: hidden; color: white; background: #222; text-decoration: none; }
.experimental__card-image, .experimental__card-image::after { position: absolute; inset: 0; }
.experimental__card-image::after { content: ""; background: linear-gradient(180deg, rgb(0 0 0 / 5%), rgb(0 0 0 / 76%)); }
.experimental__card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.22,1,.36,1), filter .8s ease; }
.experimental__card:hover .experimental__card-image img, .experimental__card:focus-visible .experimental__card-image img { transform: scale(1.08); filter: saturate(1.15); }
.experimental__card-content { position: absolute; inset: auto 22px 22px; }
.experimental__card-number { color: var(--exp-accent); font-size: 12px; font-weight: 800; }
.experimental__card h3 { max-width: 230px; margin: 12px 0 8px; font-size: clamp(24px, 2.3vw, 38px); letter-spacing: -.06em; line-height: .93; }
.experimental__card p { max-width: 220px; margin: 0; color: rgb(255 255 255 / 72%); font-size: 12px; line-height: 1.35; }
.experimental__card-arrow { position: absolute; right: 0; bottom: 0; display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid rgb(255 255 255 / 55%); font-size: 20px; transition: background .25s, color .25s; }
.experimental__card:hover .experimental__card-arrow, .experimental__card:focus-visible .experimental__card-arrow { background: var(--exp-accent); color: #111; }
.experimental__grid--banner { gap: 0; }
.experimental--dark .experimental__categories { max-width: none; padding: 0; background: var(--exp-bg); }
.experimental--dark .experimental__grid--banner { grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
.experimental--dark .experimental__grid--banner .experimental__card {
  min-height: 230px;
  border: 0;
  margin-left: -40px;
  clip-path: polygon(40px 0, 100% 0, calc(100% - 40px) 100%, 0 100%);
}
.experimental--dark .experimental__grid--banner .experimental__card:first-child { margin-left: 0; clip-path: polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%); }
.experimental--dark .experimental__grid--banner .experimental__card:last-child { clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%); }
.experimental--dark .experimental__grid--banner .experimental__card:not(:last-child)::after {
  position: absolute;
  z-index: 4;
  inset: 0;
  content: "";
  background: var(--exp-accent);
  clip-path: polygon(calc(100% - 2px) 0, 100% 0, calc(100% - 40px) 100%, calc(100% - 42px) 100%);
}
.experimental--dark .experimental__grid--banner .experimental__card-image img { transform: none; }
.experimental--dark .experimental__grid--banner .experimental__card-image::after {
  background: linear-gradient(180deg, rgb(0 0 0 / 8%), rgb(0 0 0 / 78%));
}
.experimental__banner-label { position: absolute; z-index: 3; inset: auto 30px 22px; display: flex; align-items: end; gap: 10px; }
.experimental__banner-number { flex-shrink: 0; color: #c4c8ca; opacity: .45; font-size: clamp(30px, 3.5vw, 52px); font-weight: 800; letter-spacing: -.08em; line-height: .9; }
.experimental__banner-icon {
  position: absolute;
  z-index: 2;
  right: 44px;
  top: -4px;
  display: grid;
  width: clamp(80px, 9vw, 120px);
  height: clamp(80px, 9vw, 120px);
  place-items: center;
  color: #c4c8ca;
  opacity: .45;
  pointer-events: none;
}
.experimental__banner-icon svg { width: 100%; height: 100%; }
.experimental__banner-label h3 { max-width: 230px; margin: 0; overflow-wrap: anywhere; color: var(--exp-ink); font-size: clamp(20px, 2.1vw, 34px); letter-spacing: -.06em; line-height: 1.05; }
.experimental__banner-label h3 span { color: var(--exp-accent); }
.experimental__footer { display: flex; justify-content: space-between; gap: 20px; padding: 24px clamp(20px, 4vw, 64px); border-top: 1px solid rgb(21 24 23 / 14%); color: var(--exp-muted); font-size: 11px; }
.experimental__footer a { color: inherit; text-decoration: none; }

.experimental--dark { --exp-bg: #101416; --exp-ink: #f2eee6; --exp-muted: #a5aaa4; --exp-accent: #f08a3c; }
.experimental--dark .experimental__hero { background: radial-gradient(circle at 75% 42%, #39433d 0, transparent 31%), var(--exp-bg); }
.experimental--dark .experimental__hero-machine img { filter: grayscale(.55) contrast(1.3); }
.experimental--dark .experimental__categories, .experimental--dark .experimental__footer { background: #0b0e10; }
.experimental--dark .experimental__card { border: 1px solid rgb(255 255 255 / 14%); }
.experimental--editorial { --exp-bg: #f7f5f0; --exp-ink: #1e2020; --exp-muted: #737772; --exp-accent: #d9542c; }
.experimental--editorial .experimental__hero { align-items: end; padding-bottom: 15vh; }
.experimental--editorial h1 { font-size: clamp(68px, 13vw, 205px); line-height: .7; }
.experimental--editorial .experimental__hero-copy { max-width: 1100px; }
.experimental--editorial .experimental__hero-stamp { right: 7vw; top: 22%; bottom: auto; }
.experimental--editorial .experimental__hero-machines { right: 5vw; bottom: 8%; width: min(52vw, 760px); transform: rotate(-4deg) translateY(20px); }
.experimental--editorial.is-active .experimental__hero-machines { transform: rotate(-4deg) translateY(0); }

@media (max-width: 800px) {
  .experimental__header { padding: 16px 20px; }
  .experimental__header nav { display: none; }
  .experimental__header-cta { padding: 10px; font-size: 9px; }
  .experimental__hero { min-height: 88svh; padding: 100px 20px 60px; }
  .is-active .experimental__hero { min-height: 38svh; padding-top: 100px; }
  .experimental--dark.is-active .experimental__hero { min-height: 34.2svh; padding-top: 90px; padding-bottom: 32px; }
  .experimental--dark h1 { font-size: clamp(30px, 10vw, 62px); letter-spacing: -.08em; }
  .experimental--dark .experimental__hero-copy { max-width: 100%; }
  .experimental--dark .experimental__benefits { font-size: 17px; gap: 10px; }
  .experimental__hero-stamp { right: 20px; bottom: 16%; }
  .experimental__hero-stamp strong { font-size: 88px; }
  .experimental__hero-machines { right: 20px; bottom: 8%; width: 54vw; height: 32%; }
  .experimental__hero-machine:nth-child(2) { transform: translateY(14px); }
  .experimental__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .experimental__card { min-height: 330px; }
  .experimental--dark .experimental__grid--banner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .experimental--dark .experimental__grid--banner .experimental__card { min-height: 190px; }
  .experimental--dark .experimental__grid--banner .experimental__card:nth-child(odd) { margin-left: 0; clip-path: polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%); }
  .experimental--dark .experimental__grid--banner .experimental__card:nth-child(even) { clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%); }
  .experimental--dark .experimental__grid--banner .experimental__card:nth-child(2)::after { display: none; }
  .experimental__banner-label { inset: auto 24px 16px; gap: 6px; }
  .experimental__banner-number { font-size: 28px; }
  .experimental__banner-icon { right: 32px; top: -4px; width: 80px; height: 80px; }
  .experimental__banner-label h3 { font-size: clamp(18px, 3vw, 24px); }
  .experimental__section-head { align-items: start; flex-direction: column; gap: 16px; }
  .experimental__section-head > p { text-align: left; }
  .experimental__footer { flex-wrap: wrap; }
}
@media (max-width: 600px) {
  .experimental--dark .experimental__benefits { font-size: clamp(13px, 4.2vw, 17px); }
  .experimental--dark.is-active .experimental__hero-machines { right: 0; bottom: 0; width: 75vw; height: 80%; opacity: .2; }
}
@media (prefers-reduced-motion: reduce) {
  .experimental *, .experimental *::before, .experimental *::after { transition-duration: .01ms !important; }
}
</style>