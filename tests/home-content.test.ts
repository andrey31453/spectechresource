import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("app/pages/index.vue");

describe("consolidated homepage content", () => {
  it("keeps the primary catalog and removes redundant sections", () => {
    for (const id of ["podbor", "modeli", "tehnika", "garantii", "dokumenty", "geografiya"]) {
      expect(home.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
    for (const id of ["ceny", "populyarnoe", "pochemu-my", "zadacha", "dopusk", "raschet", "usloviya"]) {
      expect(home).not.toContain(`id="${id}"`);
    }
    expect(read("app/components/SiteHeader.vue")).toContain('to="/#tehnika"');
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