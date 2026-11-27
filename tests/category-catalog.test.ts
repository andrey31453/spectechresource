import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

function setup(query: Record<string, string> = {}) {
  const prisma = {
    equipmentType: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    category: { findFirst: vi.fn() },
  };
  vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
  vi.stubGlobal("getQuery", () => query);
  vi.stubGlobal("usePrisma", () => prisma);
  vi.stubGlobal("createError", (error: unknown) => error);
  vi.stubGlobal("renderMarkdown", (text: string) => text);
  vi.stubGlobal("toHomeModel", (model: unknown) => model);
  return prisma;
}

describe("category rental routes", () => {
  it("preserves the equipment type on a category slug collision", async () => {
    const prisma = setup({ slug: "shared" });
    prisma.equipmentType.findFirst.mockResolvedValue({ id: "type" });
    const { default: handler } = await import("../server/api/rental-route.get");
    expect(await handler({} as never)).toEqual({ kind: "type" });
    expect(prisma.category.findFirst).not.toHaveBeenCalled();
  });

  it("resolves a published category and rejects an unknown address", async () => {
    const prisma = setup({ slug: "earth" });
    prisma.equipmentType.findFirst.mockResolvedValue(null);
    prisma.category.findFirst.mockResolvedValueOnce({ id: "earth" }).mockResolvedValueOnce(null);
    const { default: handler } = await import("../server/api/rental-route.get");
    expect(await handler({} as never)).toEqual({ kind: "category" });
    expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { slug: "earth", isPublished: true }, select: { id: true } });
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("restricts the database query to the category, including empty categories", async () => {
    const prisma = setup({ categorySlug: "earth" });
    const { default: handler } = await import("../server/api/catalog/models.get");
    expect(await handler({} as never)).toEqual({ types: [], models: [] });
    expect(prisma.equipmentType.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isPublished: true, category: { isPublished: true, slug: "earth" } },
      include: expect.objectContaining({ models: expect.objectContaining({ where: { isPublished: true } }) }),
    }));
  });

  it("keeps the full catalog when no category is requested", async () => {
    const prisma = setup();
    const { default: handler } = await import("../server/api/catalog/models.get");
    await handler({} as never);
    expect(prisma.equipmentType.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isPublished: true, category: { isPublished: true } },
    }));
  });
});