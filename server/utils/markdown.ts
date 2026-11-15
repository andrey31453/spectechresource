/**
 * Мини-рендер markdown для статических страниц (политика ПДн и т.п.).
 * Поддерживает: заголовки #/##/###, абзацы, списки «- », цитаты «> », **жирный**, _курсив_, ссылки.
 * HTML экранируется, поэтому вставлять разметку из админки безопасно.
 * Полноценный редактор (или `marked`) — в слайсе админки.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)_([^_]+)_/g, "$1<em>$2</em>");
}

export function renderMarkdown(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const first = lines[0] ?? "";
    const heading = /^(#{1,3})\s+(.*)$/.exec(first);

    if (heading && lines.length === 1) {
      const level = heading[1]?.length ?? 2;
      html.push(`<h${level}>${inline(heading[2] ?? "")}</h${level}>`);
      continue;
    }

    if (lines.every((line) => line.startsWith("- "))) {
      const items = lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
      continue;
    }

    if (lines.every((line) => line.startsWith(">"))) {
      const text = lines.map((line) => inline(line.replace(/^>\s?/, ""))).join(" ");
      html.push(`<blockquote>${text}</blockquote>`);
      continue;
    }

    html.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }

  return html.join("\n");
}
