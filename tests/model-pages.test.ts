import { describe, expect, it } from "vitest";
import { safeParse } from "valibot";
import { modelSlug } from "#shared/utils/model-slug";
import { ModelCreateSchema, ModelUpdateSchema } from "#shared/schemas/catalog";
import { LeadSchema } from "#shared/schemas/leads";
import { buildLeadCreateData } from "~~/server/utils/leads";
import { buildLeadPayload } from "~/mail-form/payload";

describe("model pages", () => {
  it("generates an initial code for Latin and Cyrillic names", () => {
    expect(modelSlug("CAT", "320 GC")).toBe("cat-320-gc");
    expect(modelSlug("ЧЕТРА", "Т-35")).toBe("chetra-t-35");
    expect(modelSlug("", "")).toBe("model");
    expect(modelSlug("a", "")).toBe("model-a");
    expect(modelSlug("a".repeat(100), "b").length).toBeLessThanOrEqual(80);
  });
  it("validates stored codes without requiring a code on creation", () => {
    expect(safeParse(ModelCreateSchema, { brand: "CAT", model: "320" }).success).toBe(true);
    expect(safeParse(ModelUpdateSchema, { slug: "cat-320" }).success).toBe(true);
    expect(safeParse(ModelUpdateSchema, { slug: "../cat" }).success).toBe(false);
    expect(safeParse(ModelUpdateSchema, { slug: "" }).success).toBe(false);
  });
  it("carries the model from the form into lead storage", () => {
    const payload = buildLeadPayload({
      requestId: "12345678-1234-4234-8234-123456789012", name: "Иван", phone: "+79991234567",
      consent: true, place: "equipment", pageUrl: "https://example.com/arenda-ekskavatora/cat-320",
      equipmentTypeSlug: "ekskavatora", equipmentModelId: "model-1",
    });
    const parsed = safeParse(LeadSchema, payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const data = buildLeadCreateData(parsed.output, { ip: null, userAgent: null, consentVersion: "1" }, { equipmentTypeId: "type-1", equipmentModelId: "model-1" });
    expect(data).toMatchObject({ equipmentTypeId: "type-1", equipmentModelId: "model-1" });
  });
});