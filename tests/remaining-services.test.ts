import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { safeParse } from "valibot";
import { remainingServices } from "~~/shared/content/remaining-services";
import { ServiceUpdateSchema } from "~~/shared/schemas/admin-services";
import { FaqCreateSchema } from "~~/shared/schemas/admin-content";
import { renderMarkdown } from "~~/server/utils/markdown";

describe("remaining service content", () => {
  it("targets exactly the four remaining services", () => {
    expect(remainingServices.map((item) => item.slug)).toEqual(["vyvoz-grunta", "demontazh", "planirovka-uchastka", "perevozka-tehniki-tralom"]);
  });
  for (const item of remainingServices) {
    it(`${item.slug}: validates both descriptions, SEO, unique equipment and FAQ`, () => {
      expect(safeParse(ServiceUpdateSchema, item.content).success).toBe(true);
      expect(item.equipmentSlugs.length).toBeGreaterThan(0);
      expect(new Set(item.equipmentSlugs).size).toBe(item.equipmentSlugs.length);
      for (const text of [item.content.descriptionTop, item.content.descriptionBottom]) {
        expect(text.length).toBeGreaterThan(900);
        const html = renderMarkdown(text);
        expect(html).toContain("<h2>");
        expect(html).not.toContain("<h1>");
        expect(html).not.toContain("**");
      }
      expect(item.faq).toHaveLength(4);
      expect(new Set(item.faq.map((faq) => faq.question)).size).toBe(4);
      for (const faq of item.faq) {
        expect(safeParse(FaqCreateSchema, { ...faq, scope: "SERVICE", serviceId: "service-id" }).success).toBe(true);
        expect(faq.answer.length).toBeGreaterThan(80);
      }
    });
  }
  it("uses one service template without earthworks-only copy or fallback markup", () => {
    const page = readFileSync(new URL("../app/pages/uslugi/[slug].vue", import.meta.url), "utf8");
    expect(page).toContain("data-service-page");
    expect(page.match(/<ServiceEquipmentShowcase /g)).toHaveLength(1);
    expect(page).not.toContain("earthworksSlug");
    expect(page).not.toContain("Куда перемещаем грунт");
    expect(page).not.toContain("v-else-if");
  });
});