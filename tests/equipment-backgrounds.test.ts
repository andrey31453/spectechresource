import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { equipmentBackgrounds } from "../app/utils/equipment-backgrounds";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("equipment page background", () => {
  it("provides eight distinct inline engineering schemes", () => {
    expect(equipmentBackgrounds).toHaveLength(8);
    expect(new Set(equipmentBackgrounds.map(item => item.name)).size).toBe(8);
    expect(new Set(equipmentBackgrounds.map(item => item.path)).size).toBe(8);
    for (const item of equipmentBackgrounds) {
      expect(item.path).toMatch(/^M[\d .a-zA-Z-]+$/);
      expect(item.accent).toMatch(/^M[\d .a-zA-Z-]+$/);
    }
  });

  it("shares the random choice with hydration and keeps decoration inert", () => {
    const source = read("app/components/EquipmentPageBackground.vue");
    expect(source).toContain("useState<number>(`equipment-background:${route.path}`");
    expect(source).toContain("Math.floor(Math.random() * equipmentBackgrounds.length)");
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain('focusable="false"');
    expect(source).toContain("pointer-events-none");
    expect(source).not.toMatch(/<img|<button|animate-|setInterval/);
    const page = read("app/pages/arenda-[type]/[model].vue");
    expect(page).toContain("relative isolate bg-[#f4f5f6]");
    expect(page).toContain("<EquipmentPageBackground />");
  });
});