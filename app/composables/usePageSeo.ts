interface PageSeoOptions {
  title: string;
  description?: string | null;
  /** Путь без домена, без завершающего слеша: "/katalog". */
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
}

/** Мета страницы + абсолютный canonical из NUXT_PUBLIC_SITE_URL. */
export function usePageSeo(options: PageSeoOptions): { canonical: string } {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const base = String(siteUrl).replace(/\/+$/, "");
  const canonical = options.path === "/" ? `${base}/` : `${base}${options.path}`;

  useSeoMeta({
    title: options.title,
    description: options.description ?? undefined,
    ogTitle: options.title,
    ogDescription: options.description ?? undefined,
    ogType: options.type ?? "website",
    ogUrl: canonical,
    robots: options.noindex ? "noindex, nofollow" : "index, follow",
  });

  useHead({ link: [{ rel: "canonical", href: canonical }] });

  return { canonical };
}
