/**
 * Склейка URL (ADR-6): `/path/` → 301 на `/path`, затем запись из таблицы `Redirect`.
 * Если БД недоступна, редиректы молча пропускаются — сайт не должен падать из-за этого.
 */
export default defineEventHandler(async (event) => {
  const { pathname, search } = getRequestURL(event);

  if (pathname === "/" || pathname.startsWith("/_") || pathname.startsWith("/__")) return;

  if (pathname.endsWith("/")) {
    return sendRedirect(event, pathname.replace(/\/+$/, "") + search, 301);
  }

  try {
    const target = (await getRedirectMap()).get(pathname);
    if (target) return sendRedirect(event, target + search, 301);
  } catch (error) {
    console.error("[redirects] таблица redirects недоступна:", error);
  }
});
