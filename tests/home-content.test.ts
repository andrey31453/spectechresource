import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("app/pages/index.vue");

describe("consolidated homepage content", () => {
  it("replaces individual machines with type card grids and removes the duplicate category overview", () => {
    expect(home).toContain("<HomeTypeSections");
    expect(home).not.toContain("<HomeModelsSignatureSections");
    expect(home).not.toContain('id="katalog"');
    expect(home).not.toContain("От котлована до свай");
    const cards = read("app/components/HomeTypeSections.vue");
    expect(cards).toContain("typePath(type.slug)");
    expect(cards).toContain("type.modelsCount");
    expect(cards).toContain("type.description");
    expect(cards).toContain("formatPriceFrom(type.priceFrom, type.priceUnit)");
    expect(cards).not.toContain("modelPath");
    expect(cards).toContain("object-cover");
    expect(cards).not.toContain("object-contain");
    expect(cards).toContain("pagination(section).models");
    expect(cards).toContain("grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4");
    expect(cards).toContain("Предыдущая страница видов техники");
    expect(cards).toContain("Следующая страница видов техники");
    expect(cards).toContain(":aria-current=");
  });
  it("combines the homepage request block and footer in three columns", () => {
    const footer = read("app/components/SiteFooter.vue");
    expect(home).not.toContain('<section id="zayavka"');
    expect(home.split("<SiteFooter ")).toHaveLength(2);
    expect(home).toContain(':services="services" stars>');
    expect(home).toContain('<template #form>');
    expect(home).toContain('<LeadForm place="callback"');
    expect(footer).toContain('v-if="stars" id="zayavka"');
    expect(footer).toContain('stars stars--far');
    expect(footer).toContain('stars stars--giant');
    expect(footer.indexOf('data-footer-catalog')).toBeLessThan(footer.indexOf('data-footer-form'));
    expect(footer.indexOf('data-footer-form')).toBeLessThan(footer.indexOf('data-footer-contacts'));
    expect(footer).toContain('categoryPath(category.slug)');
    expect(footer).toContain('© {{ year }} {{ site.companyName }}.');
    expect(footer).toContain('<footer v-else');
  });

  it("keeps the star footer airy with bottom-aligned navigation and no price disclaimer", () => {
    const footer = read("app/components/SiteFooter.vue");
    const stars = footer.slice(footer.indexOf('<footer v-if="stars"'), footer.indexOf('<footer v-else'));
    expect(stars).not.toContain("site.priceDisclaimer");
    expect(stars).toContain("py-20!");
    expect(stars).toContain("md:py-28!");
    expect(stars).toContain("xl:py-32!");
    expect(stars).toContain('data-footer-catalog class="flex min-w-0 flex-col');
    expect(stars).toContain('data-footer-contacts class="flex min-w-0 flex-col');
    expect(stars.match(/lg:mt-auto/g)).toHaveLength(2);
    expect(stars).toContain("[&_form]:p-6!");
    expect(stars).toContain("xl:[&_form]:p-10!");
    expect(stars).toContain("[&_form>div.grid]:gap-6!");
    expect(stars).toContain("data-footer-bottom");
  });

  it("removes desktop footer separators and keeps only two on smaller screens", () => {
    const footer = read("app/components/SiteFooter.vue");
    const stars = footer.slice(footer.indexOf('<footer v-if="stars"'), footer.indexOf('<footer v-else'));
    expect(stars.match(/\bborder-t\b/g)).toHaveLength(4);
    expect(stars.match(/lg:border-t-0/g)).toHaveLength(2);
    expect(stars).not.toContain("lg:border-l");
    expect(stars).not.toContain("<hr");
    const navigation = [...stars.matchAll(/<nav[^>]*>/g)].map(([tag]) => tag);
    expect(navigation).toHaveLength(3);
    for (const tag of navigation) expect(tag).not.toContain("border-");
  });

  it("uses a dark single-column homepage FAQ and a single-column shared FAQ", () => {
    const faq = home.slice(home.indexOf('<section id="faq"'), home.indexOf('</main>'));
    expect(faq).toContain('class="band bg-night text-snow"');
    expect(faq).toContain("grid grid-cols-1 gap-4");
    expect(faq).not.toContain("on-light");
    expect(faq).not.toContain("grid-cols-2");
    expect(read("app/components/FaqList.vue")).toContain('class="grid grid-cols-1 gap-3"');
  });

  it("places the estimate before delivery and the FAQ after delivery", () => {
    const documents = home.indexOf('<section id="dokumenty"');
    const estimate = home.indexOf('<section id="cta"');
    const delivery = home.indexOf('<section id="geografiya"');
    const faq = home.indexOf('<section id="faq"');
    expect(estimate).toBeGreaterThan(documents);
    expect(delivery).toBeGreaterThan(estimate);
    expect(faq).toBeGreaterThan(delivery);
  });

  it("keeps the primary catalog and removes redundant sections", () => {
    for (const id of ["podbor", "modeli", "tehnika", "garantii", "dokumenty", "geografiya"]) {
      expect(home.split(`id="${id}"`)).toHaveLength(2);
    }
    for (const id of ["ceny", "populyarnoe", "pochemu-my", "zadacha", "dopusk", "raschet", "usloviya"]) {
      expect(home).not.toContain(`id="${id}"`);
    }
    expect(read("app/components/SiteHeader.vue")).toContain('to="/stoimost"');
    expect(read("app/components/SiteHeader.vue")).not.toContain('/#ceny');
  });

  it("places one tender card after document tabs, not inside their loop", () => {
    const start = home.indexOf('<section id="dokumenty"');
    const end = home.indexOf('<section id="geografiya"');
    const documents = home.slice(start, end);
    expect(documents.match(/id="tendery"/g)).toHaveLength(1);
    expect(documents.indexOf('id="tendery"')).toBeGreaterThan(documents.lastIndexOf('</section>', documents.indexOf('id="tendery"')));
    expect(documents).toContain('data-tender-cta');
    expect(home).not.toContain('id: "tender"');
    expect(home).not.toContain('минимальный заказ — одна смена');
    expect(home).not.toContain('Заправка, ТО и текущий ремонт — наша зона');
  });

  it("uses the approved warm palette by default on the homepage only", () => {
    expect(home).not.toContain('route.query.palette');
    expect(home).not.toContain('warmAmberPalette');
    expect(home).toContain('class: "landing-page palette-warm-amber"');
    expect(home).toContain('href: "/landing/warm-amber.css"');
    expect(read("public/landing/warm-amber.css")).toContain("#f7f3ed");
    expect(read("public/landing/warm-amber.css")).toContain("#ffa43e");
    expect(read("app/assets/css/tailwind.css")).not.toContain("#f7f3ed");
    expect(read("app/layouts/default.vue")).not.toContain("warm-amber.css");
    expect(read("nuxt.config.ts")).not.toContain("warm-amber.css");
  });
});