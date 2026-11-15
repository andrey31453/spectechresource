import { describe, expect, it } from "vitest";
import { renderMarkdown } from "~~/server/utils/markdown";

describe("renderMarkdown", () => {
  it("экранирует HTML, пришедший из контента", () => {
    expect(renderMarkdown('<script>alert("x")</script>')).toBe(
      "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>",
    );
  });

  it("превращает #, ##, ### в заголовки соответствующего уровня", () => {
    expect(renderMarkdown("# Политика")).toBe("<h1>Политика</h1>");
    expect(renderMarkdown("## Раздел")).toBe("<h2>Раздел</h2>");
    expect(renderMarkdown("### Подраздел")).toBe("<h3>Подраздел</h3>");
  });

  it("не считает заголовком уровень глубже третьего", () => {
    expect(renderMarkdown("#### Глубоко")).toBe("<p>#### Глубоко</p>");
  });

  it("не делает заголовком блок, где после заголовка идёт текст", () => {
    expect(renderMarkdown("## Заголовок\nТекст")).toBe("<p>## Заголовок<br>Текст</p>");
  });

  it("собирает список из строк, начинающихся с «- »", () => {
    expect(renderMarkdown("- Один\n- Два")).toBe("<ul><li>Один</li><li>Два</li></ul>");
  });

  it("собирает многострочную цитату в один blockquote", () => {
    expect(renderMarkdown("> Первая строка\n> Вторая строка")).toBe(
      "<blockquote>Первая строка Вторая строка</blockquote>",
    );
  });

  it("переносы строк внутри абзаца сохраняет через <br>", () => {
    expect(renderMarkdown("Строка 1\nСтрока 2")).toBe("<p>Строка 1<br>Строка 2</p>");
  });

  it("поддерживает **жирный** и _курсив_", () => {
    expect(renderMarkdown("**важно** и _курсив_")).toBe("<p><strong>важно</strong> и <em>курсив</em></p>");
  });

  it("делает ссылку только для http/https и добавляет rel=noopener", () => {
    expect(renderMarkdown("[политика](https://example.com/doc?a=1)")).toBe(
      '<p><a href="https://example.com/doc?a=1" rel="noopener">политика</a></p>',
    );
    expect(renderMarkdown("[x](javascript:alert(1))")).toBe("<p>[x](javascript:alert(1))</p>");
  });

  it("нормализует CRLF и разделяет блоки пустой строкой", () => {
    expect(renderMarkdown("# Заголовок\r\n\r\nТекст")).toBe("<h1>Заголовок</h1>\n<p>Текст</p>");
  });

  it("возвращает пустую строку для пустого или пробельного контента", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown("   \n\n  ")).toBe("");
  });

  it("не оставляет незакрытых тегов при вложенной разметке", () => {
    const html = renderMarkdown("**<b>текст</b>**");
    expect(html).toBe("<p><strong>&lt;b&gt;текст&lt;/b&gt;</strong></p>");
  });
});
