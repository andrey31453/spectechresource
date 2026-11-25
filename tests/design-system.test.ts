import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("shared design system", () => {
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
  it("shares model specifications and compact shelf spacing", () => {
    const shelf = read("app/components/HomeModelsSignatureSections.vue");
    expect(shelf).toContain("mt-6 min-w-0 scroll-mt-24 md:mt-8");
    expect(shelf).not.toContain("scroll-mt-24 pt-10");
    expect(shelf).toContain("<ModelSpecs");
    expect(read("app/pages/arenda-[slug].vue")).toContain("<ModelSpecs");
  });
});