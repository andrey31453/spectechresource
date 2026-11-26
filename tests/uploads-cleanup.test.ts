import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), references: vi.fn() }));
vi.mock("../server/utils/uploads", () => ({ listUploadFiles: mocks.list, removeUploadFile: mocks.remove }));
vi.mock("../server/utils/upload-references", async (original) => ({
  ...await original<typeof import("../server/utils/upload-references")>(),
  loadUploadReferences: mocks.references,
}));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("uploads cleanup", () => {
  it("protects referenced and recently touched groups, deleting only old orphans", async () => {
    vi.stubGlobal("defineTask", (task: unknown) => task);
    vi.stubGlobal("usePrisma", () => ({}));
    const path = (id: number, variant: string) => `2026/11/00000000-0000-4000-8000-${String(id).padStart(12, "0")}-${variant}.webp`;
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recent = new Date();
    mocks.references.mockResolvedValue({ categories: [], services: [], types: [], models: [{ brand: "JCB", model: "3CX", photos: [`/uploads/${path(1, "full")}`] }] });
    mocks.list.mockResolvedValue([1, 2, 3].flatMap(id => ["small", "medium", "full"].map(variant => ({ path: path(id, variant), size: 100, modifiedAt: id === 2 && variant === "medium" ? recent : old }))));
    mocks.remove.mockResolvedValue(true);
    const { default: task } = await import("../server/tasks/uploads/cleanup");
    const result = await task.run({} as never);
    expect(mocks.remove.mock.calls.map(([path]) => path)).toEqual(["small", "medium", "full"].map(v => path(3, v)));
    expect(result).toEqual({ result: { scanned: 9, referenced: 3, removed: 3, keptRecent: 3 } });
  });
});