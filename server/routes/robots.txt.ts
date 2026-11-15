/** robots.txt: закрываем админку и API, указываем карту сайта. */
export default defineEventHandler((event) => {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();
  const base = String(siteUrl).replace(/\/+$/, "");

  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /api",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
});
