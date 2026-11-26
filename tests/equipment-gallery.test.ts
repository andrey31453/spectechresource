import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("equipment photos contract", () => {
  it("uses small thumbnails and medium product photos", () => {
    const source = read("app/components/EquipmentGallery.vue");
    expect(source).toContain("imageVariantUrl(photo, 'small')");
    expect(source).toContain("imageVariantUrl(active, 'medium')");
    expect(source).toContain("<PhotoViewer");
  });
  it("requests full photo only while dialog is open, restores focus and closes on navigation", () => {
    const source = read("app/components/PhotoViewer.vue");
    expect(source).toContain("opened && active && !failed");
    expect(source).toContain("imageVariantUrl(active, 'full')");
    expect(source).toContain("trigger.focus({ preventScroll: true })");
    expect(source).toContain("onBeforeRouteLeave(close)");
    expect(source).toContain("event.shiftKey");
  });
  it("places carousel outside the link and supplies the whole photo array", () => {
    const source = read("app/components/CatalogModelsGrid.vue");
    expect(source.indexOf("<CatalogPhotoCarousel")).toBeLessThan(source.indexOf("<NuxtLink"));
    expect(source).toContain(':photos="model.photos"');
    const carousel = read("app/components/CatalogPhotoCarousel.vue");
    expect(carousel).toContain("imageVariantUrl(active, 'small')");
    expect(carousel).toContain("@touchend.passive");
    expect(carousel).toContain("group-focus-within/photo:opacity-100");
  });
});