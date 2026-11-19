<script setup lang="ts">
import { computed } from "vue";
import type { CategoryCardDto, TypeCardDto } from "~/types/catalog";

/**
 * Блок «Типовые задачи» (бриф §3.4): задача → виды техники → раздел.
 * Виды берём из живого каталога по slug, поэтому ссылки и названия
 * не расходятся с админкой; задачи — маркетинговая статика страницы.
 */
const props = defineProps<{
  categories: CategoryCardDto[];
  citySlug: string;
}>();

interface TaskSeed {
  title: string;
  text: string;
  categorySlug: string;
  typeSlugs: string[];
}

const taskSeeds: TaskSeed[] = [
  {
    title: "Земляные работы",
    text: "Котлованы и траншеи, обратная засыпка, планировка.",
    categorySlug: "zemleroynaya-tehnika",
    typeSlugs: [
      "gusenichnogo-ekskavatora",
      "kolesnogo-ekskavatora",
      "mini-ekskavatora",
      "transheekopatelya",
    ],
  },
  {
    title: "Дорожное строительство и ремонт",
    text: "Устройство и ремонт покрытий, фрезерование, уплотнение.",
    categorySlug: "dorozhno-remontnaya-tehnika",
    typeSlugs: ["avtogreydera", "katka", "dorozhnoy-frezy", "asfaltoukladchika"],
  },
  {
    title: "Погрузка и склад",
    text: "Разгрузка, перемещение грузов, работа в стеснённых условиях.",
    categorySlug: "pogruzochnaya-tehnika",
    typeSlugs: [
      "mini-pogruzchika",
      "vilochnogo-pogruzchika",
      "teleskopicheskogo-pogruzchika",
      "frontalnogo-pogruzchika",
    ],
  },
  {
    title: "Монтаж и подъём",
    text: "Подъём конструкций, монтаж с высоты, работы на опорах.",
    categorySlug: "podyomnaya-tehnika",
    typeSlugs: ["avtokrana", "gusenichnogo-krana", "avtovyshki", "bashennogo-avtokrana"],
  },
  {
    title: "Бетон и сваи",
    text: "Подача бетона, погружение свай, уплотнение грунта.",
    categorySlug: "stroitelnaya-tehnika",
    typeSlugs: [
      "avtobetononasosa",
      "avtobetonosmesitelya",
      "vibropogruzhatelya",
      "svaeboynoy-ustanovki",
    ],
  },
  {
    title: "Вывоз и коммунальные работы",
    text: "Вывоз грунта и мусора, промывка сетей, полив дорог.",
    categorySlug: "transportnaya-tehnika",
    typeSlugs: ["samosvala", "manipulyatora", "ilososa", "vodovoza"],
  },
];

const typeBySlug = computed(
  () => new Map(props.categories.flatMap((category) => category.types.map((type) => [type.slug, type] as const))),
);

const tasks = computed(() =>
  taskSeeds.flatMap((task) => {
    const category = props.categories.find((item) => item.slug === task.categorySlug);
    const types = task.typeSlugs
      .map((slug) => typeBySlug.value.get(slug))
      .filter((type): type is TypeCardDto => Boolean(type));

    if (!category || types.length === 0) return [];

    return [{ title: task.title, text: task.text, category, types }];
  }),
);
</script>

<template>
  <section v-if="tasks.length" class="bg-surface">
    <div class="mx-auto max-w-site px-5 py-14 md:px-8 md:py-[84px]">
      <SectionHead
        kicker="Задачи"
        title="Какие задачи закрываем"
        lead="Соберите комплект техники под один объект — от разработки грунта до вывоза и благоустройства."
      />

      <ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="task in tasks"
          :key="task.title"
          class="flex h-full flex-col rounded-card border border-line bg-surface p-5"
        >
          <h3 class="text-[clamp(1.05rem,2vw,1.3rem)] leading-snug font-bold text-ink">
            {{ task.title }}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ task.text }}</p>

          <ul class="mt-4 flex flex-wrap gap-2">
            <li v-for="type in task.types" :key="type.slug">
              <NuxtLink
                :to="typePath(type.slug, citySlug)"
                class="inline-flex rounded-full border border-line bg-surface-soft px-3 py-1 text-xs text-ink transition-colors hover:border-brand/50 hover:text-brand"
              >
                {{ type.name }}
              </NuxtLink>
            </li>
          </ul>

          <div class="mt-auto pt-5">
            <NuxtLink
              :to="categoryPath(task.category.slug)"
              class="flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted transition-colors hover:text-brand"
            >
              <span>Раздел «{{ task.category.title }}»</span>
              <SiteIcon name="arrow" class="h-4 w-4 text-brand" />
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>