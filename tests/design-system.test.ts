import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("shared design system", () => {
  it("uses a subtle footer link background and stationary border-based button hover", () => {
    const footer = read("app/components/SiteFooter.vue");
    expect(footer).toContain("[&_a:hover]:bg-flame/10");
    expect(footer).toContain("[&_a:hover]:no-underline!");
    expect(footer).toContain("[&_a]:px-2");
    expect(footer).toContain("[&_a]:-mx-2");
    expect(footer).toContain("[&_a]:rounded-field");
    const buttons = read("app/components/SiteButton.vue");
    expect(buttons).not.toContain("hover:brightness");
    expect(buttons).not.toContain("hover:shadow");
    expect(buttons).not.toContain("hover:translate");
    const landing = read("public/landing/style.css");
    expect(landing).not.toContain(".btn:hover{transform:");
    expect(landing).not.toContain(".btn--primary:hover{box-shadow:");
    expect(landing).toContain(".btn--primary:hover{border-color:var(--color-snow)}");
    const css = read("app/assets/css/tailwind.css");
    expect(css).toMatch(/button\[type="submit"\]:hover:not\(:disabled\)\s*\{\s*border-color: var\(--color-snow\);/);
  });
  it("uses the homepage palette and font globally instead of page-specific overrides", () => {
    const home = read("app/pages/index.vue");
    expect(home).not.toContain('href: "/landing/warm-amber.css"');
    expect(home).not.toContain('key: "landing-font"');
    expect(read("nuxt.config.ts")).toContain('key: "site-font"');
    const tokens = read("app/assets/css/tailwind.css");
    expect(tokens).toContain('--color-flame: #ff901e;');
    expect(tokens).toContain('--color-sand: #f7f3ed;');
  });
  it("owns the complete footer and its star styles independently of the homepage", () => {
    const footer = read("app/components/SiteFooter.vue");
    expect(footer.match(/<footer\b/g)).toHaveLength(1);
    expect(footer).toContain('useFetch<HomeDto>("/api/home"');
    expect(footer).toContain('content.value?.categories ?? []');
    expect(footer).toContain('content.value?.services ?? []');
    expect(footer).toContain('<LeadForm place="callback" :equipment-types="equipmentTypes"');
    expect(footer).toContain('<style scoped>');
    expect(footer).toContain('--stars-far-field:');
    expect(footer).toContain('prefers-reduced-motion: reduce');
    expect(footer).not.toContain('landing-page');
    expect(footer).not.toContain('stars?:');
    expect(read("public/landing/style.css")).not.toContain('--stars-far-field');
  });
  it("centers desktop navigation independently of side content and removes redundant menu entries", () => {
    const header = read("app/components/SiteHeader.vue");
    expect(header).toContain("lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(header).toContain("justify-self-center");
    expect(header).not.toContain("Весь каталог");
    expect(header).not.toContain("Все услуги");
  });
  it("uses the same fixed 50/25/25 columns for every price table", () => {
    const prices = read("app/pages/stoimost.vue");
    expect(prices).toContain("table-fixed");
    expect(prices).toContain('<col class="w-1/2">');
    expect(prices.split('<col class="w-1/4">')).toHaveLength(3);
  });
  it("shares soft corner tokens with legacy landing components", () => {
    const tokens = read("app/assets/css/tailwind.css");
    expect(tokens).toContain("--radius-card: 8px;");
    expect(tokens).toContain("--radius-field: 6px;");
    const landing = read("public/landing/style.css");
    expect(landing).toContain("border-radius:var(--radius-card)");
    expect(landing).toContain("border-radius:var(--radius-field)");
    expect(landing).not.toMatch(/border-radius:[23]px/);
    expect(read("app/pages/stoimost.vue")).toContain("overflow-x-auto rounded-card border");
  });
  it("uses selected interlocking logo across public and admin shells", () => {
    const logo = read("app/components/SiteLogo.vue");
    expect(logo).toContain("M512 822L818 645");
    expect(logo).toContain("M206 499L308 440");
    expect(logo).toContain("translate(0 1024) scale(1 -1)");
    for (const path of ["app/components/SiteBrand.vue", "app/layouts/admin.vue", "app/pages/index5.vue", "app/pages/index6.vue"]) {
      expect(read(path)).toContain("<SiteLogo");
      expect(read(path)).not.toContain("M0 35.5");
    }
  });
  it("declares existing favicon assets globally", () => {
    const config = read("nuxt.config.ts");
    for (const name of ["favicon.ico", "favicon.svg", "favicon-32x32.png", "apple-touch-icon.png"]) {
      expect(config).toContain(`/${name}?v=6`);
      expect(existsSync(new URL(`../public/${name}`, import.meta.url))).toBe(true);
    }
  });
  it("uses shared navigation on home and internal pages", () => {
    for (const path of ["app/pages/index.vue", "app/layouts/default.vue"]) {
      const source = read(path);
      expect(source).toContain("<SiteHeader");
      expect(source).toContain("<SiteFooter");
    }
  });
  it("uses the same catalog types source in the header on home and internal pages", () => {
    const home = read("app/pages/index.vue");
    const layout = read("app/layouts/default.vue");
    expect(home).toContain("const headerTypes = await useCatalogNavigation()");
    expect(home).toMatch(/<SiteHeader[^>]*:categories="headerTypes"/);
    expect(home).not.toMatch(/<SiteHeader[^>]*:categories="categories"/);
    expect(home).toContain('<SiteFooter v-if="site" :site="site" />');
    expect(layout).toContain('<SiteFooter v-if="site" :site="site" />');
    expect(layout).toContain("const navCategories = await useCatalogNavigation()");
    expect(layout).toMatch(/<SiteHeader[^>]*:categories="navCategories"/);
    const navigation = read("app/composables/useCatalogNavigation.ts");
    expect(navigation).toContain('"/api/catalog"');
    expect(navigation).toContain("title: type.name");
    expect(navigation).not.toContain("/api/home");
  });
  it("keeps only the retained experimental routes", () => {
    for (const index of [2, 3, 4]) {
      expect(existsSync(new URL(`../app/pages/index${index}.vue`, import.meta.url))).toBe(false);
    }
    for (const index of [5, 6]) {
      expect(read(`app/pages/index${index}.vue`)).toContain("noindex: true");
    }
  });
  it("does not duplicate Tailwind utilities or global theme in landing CSS", () => {
    const css = read("public/landing/style.css");
    expect(css).not.toContain("@layer theme");
    expect(css).not.toContain("@layer utilities");
    expect(css).toContain("body.landing-page");
    expect(read("app/assets/css/main.css")).not.toMatch(/body:not\(\.landing-page\) \.grid\s*\{/);
  });
  it("keeps the desktop catalog filter sticky and scrollable within the viewport", () => {
    const catalog = read("app/components/CatalogListing.vue");
    expect(catalog).toContain("lg:sticky lg:top-24");
    expect(catalog).toContain("lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto");
  });
  it("uses a wider shared card grid on type pages without a sidebar", () => {
    const landing = read("app/components/EquipmentTypeLanding.vue");
    expect(landing).toContain('<CatalogModelsGrid :models="models" wide :equipment-type-slug="typeSlug" :equipment-label="landing.type.name" />');
    expect(landing).not.toContain("<aside");
    expect(read("app/components/CatalogModelsGrid.vue")).toContain("wide ? 'lg:grid-cols-3 xl:grid-cols-4' : 'xl:grid-cols-3'");
    expect(read("app/pages/katalog/index.vue")).not.toContain(" wide");
  });
  it("offers contextual help and the shared lead form when models are unavailable", () => {
    const grid = read("app/components/CatalogModelsGrid.vue");
    expect(grid).toContain('v-else class="flex min-w-0');
    expect(grid).toContain("data-catalog-empty");
    expect(grid).toContain("border-danger-line bg-danger-soft");
    expect(grid).toContain("size-16 shrink-0 text-danger sm:size-20");
    expect(grid).toContain('aria-hidden="true"');
    expect(grid).toContain('role="status"');
    expect(grid).toContain("Нет техники в списке? Поможем решить вашу задачу");
    expect(grid).toContain("предложим возможные варианты решения");
    expect(grid).toContain('<SiteButton href="#zayavka" :data-equipment-type-slug="equipmentTypeSlug" :data-equipment-label="equipmentLabel"');
    expect(grid).toContain("Обсудить задачу");
    expect(read("app/components/CatalogListing.vue")).toContain(':equipment-type-slug="selectedType?.slug" :equipment-label="selectedType?.name"');
  });
  it("shares model specifications and compact shelf spacing", () => {
    const shelf = read("app/components/HomeModelsSignatureSections.vue");
    expect(shelf).toContain("mt-6 min-w-0 scroll-mt-24 md:mt-8");
    expect(shelf).not.toContain("scroll-mt-24 pt-10");
    expect(shelf).toContain("<ModelSpecs");
    expect(read("app/components/EquipmentTypeLanding.vue")).toContain("<CatalogModelsGrid");
    expect(read("app/components/CatalogModelsGrid.vue")).not.toContain("<ModelSpecs");
  });
});