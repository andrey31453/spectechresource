import { describe, expect, it } from "vitest";
import { safeParse } from "valibot";
import { earthworksContent, earthworksDescriptions, earthworksFaq, earthworksSlug } from "~~/shared/content/earthworks";
import { ServiceUpdateSchema } from "~~/shared/schemas/admin-services";
import { renderMarkdown } from "~~/server/utils/markdown";

describe("earthworks content", () => {
  it("делит текст без потери абзацев перед разделом стоимости", () => {
    expect(`${earthworksDescriptions.descriptionTop}\n\n${earthworksDescriptions.descriptionBottom}`).toBe(earthworksContent.seoText);
    expect(earthworksDescriptions.descriptionBottom.startsWith("## Из чего складывается стоимость")).toBe(true);
    expect(safeParse(ServiceUpdateSchema, earthworksDescriptions).success).toBe(true);
  });
  it("соответствует схеме редактора услуг", () => {
    expect(safeParse(ServiceUpdateSchema, earthworksContent).success).toBe(true);
    expect(earthworksSlug).toBe("zemlyanye-raboty");
  });

  it("рендерит основные разделы без второго h1 и сырой разметки", () => {
    const html = renderMarkdown(earthworksContent.seoText);
    expect(html.match(/<h2>/g)).toHaveLength(5);
    expect(html).not.toContain("<h1>");
    expect(html).not.toContain("**");
    expect(html).toContain("<ul>");
    expect(html).toContain("<blockquote>");
  });

  it("содержит четыре уникальных вопроса с ответами", () => {
    expect(earthworksFaq).toHaveLength(4);
    expect(new Set(earthworksFaq.map((item) => item.question)).size).toBe(4);
    expect(earthworksFaq.every((item) => item.answer.length > 50)).toBe(true);
  });
});