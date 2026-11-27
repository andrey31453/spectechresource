import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("type page photo gallery", () => {
  const gallery = read("app/components/TypePhotoGallery.vue");
  const page = read("app/components/EquipmentTypeLanding.vue");

  it("places models before the compact gallery", () => {
    expect(page.indexOf("data-model-list")).toBeLessThan(page.indexOf("<TypePhotoGallery"));
    expect(page).not.toContain("coverPhoto");
    expect(gallery).toContain("overflow-x-auto");
    expect(gallery).toContain("h-[120px]");
    expect(gallery).toContain("sm:h-[160px]");
  });

  it("opens an uncropped full-screen modal and restores focus", () => {
    expect(gallery).toContain("<dialog");
    expect(gallery).toContain("showModal()");
    expect(gallery).toContain("max-h-full max-w-full object-contain");
    expect(gallery).toContain("trigger.focus({ preventScroll: true })");
    expect(gallery).toContain('@close="restore"');
  });

  it("supports arrows and hides them for one photo", () => {
    expect(gallery).toContain('event.key === "ArrowLeft" ? -1 : 1');
    expect(gallery.match(/v-if="photos.length > 1"/g)).toHaveLength(2);
    expect(gallery).toContain("% props.photos.length");
  });
});