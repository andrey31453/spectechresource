import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { processUploadImage, InvalidUploadImage } from "../server/utils/image-processing";
import { saveUploadImage, removeUploadGroup } from "../server/utils/uploads";
import { IMAGE_VARIANTS, imageVariantUrl, uploadGroupPaths, uploadPathFromUrl } from "../shared/utils/uploads";
import { referencedUploadPaths } from "../server/utils/upload-references";

const root = "/uploads/2026/11/0f0e0d0c-0b0a-4908-8706-050403020100";
const directories: string[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
const image = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#ee7700" } });

describe("image processing", () => {
  it("creates three WebP sizes inside bounds, preserving aspect ratio and stripping EXIF", async () => {
    const input = await image(3000, 2000).jpeg().withMetadata().toBuffer();
    const result = await processUploadImage(input);
    for (const variant of Object.keys(IMAGE_VARIANTS) as Array<keyof typeof IMAGE_VARIANTS>) {
      const meta = await sharp(result[variant]).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBeLessThanOrEqual(IMAGE_VARIANTS[variant].width);
      expect(meta.height).toBeLessThanOrEqual(IMAGE_VARIANTS[variant].height);
      expect(meta.width! / meta.height!).toBeCloseTo(1.5, 1);
      expect(meta.exif).toBeUndefined();
      expect(meta.icc).toBeUndefined();
    }
  });
  it("rotates before resizing and does not enlarge small photos", async () => {
    const input = await image(120, 80).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await processUploadImage(input);
    for (const bytes of Object.values(result)) {
      const meta = await sharp(bytes).metadata();
      expect([meta.width, meta.height]).toEqual([80, 120]);
      expect(meta.orientation).toBeUndefined();
    }
  });
  it("rejects corrupt, oversized and excessive-pixel files", async () => {
    await expect(processUploadImage(Buffer.from("not an image"))).rejects.toBeInstanceOf(InvalidUploadImage);
    await expect(processUploadImage(new Uint8Array(5 * 1024 * 1024 + 1))).rejects.toBeInstanceOf(InvalidUploadImage);
    const huge = await image(6500, 6500).png().toBuffer();
    await expect(processUploadImage(huge)).rejects.toBeInstanceOf(InvalidUploadImage);
  });
  it("saves and removes a complete image group, without keeping original", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spectech-images-"));
    directories.push(dir);
    vi.stubGlobal("useRuntimeConfig", () => ({ uploadsDir: dir }));
    const saved = await saveUploadImage(await image(120, 80).png().toBuffer(), "image/png");
    expect(saved.url).toMatch(/-full\.webp$/);
    expect(saved.mime).toBe("image/webp");
    expect(Object.keys(saved.variants)).toEqual(["small", "medium", "full"]);
    expect(await readdir(join(dir, saved.path.split("/").slice(0, 2).join("/")))).toHaveLength(3);
    expect(await removeUploadGroup(uploadPathFromUrl(saved.variants.small)!)).toBe(true);
    expect(await removeUploadGroup(saved.path)).toBe(false);
  });
});

describe("variant paths and references", () => {
  it("resolves siblings only for valid generated variants", () => {
    expect(imageVariantUrl(`${root}-full.webp`, "small")).toBe(`${root}-small.webp`);
    for (const url of ["https://example.org/test-full.webp", "/landing/a.webp", `${root}.jpg`, "/uploads/../../a-full.webp"]) {
      expect(imageVariantUrl(url, "small")).toBe(url);
    }
    expect(uploadGroupPaths("../../a-full.webp")).toEqual([]);
  });
  it("protects all three files if any variant is referenced", () => {
    const paths = referencedUploadPaths([`${root}-medium.webp`]);
    expect(paths.size).toBe(3);
    expect(paths.has(uploadPathFromUrl(`${root}-small.webp`)!)).toBe(true);
    expect(paths.has(uploadPathFromUrl(`${root}-full.webp`)!)).toBe(true);
  });
});