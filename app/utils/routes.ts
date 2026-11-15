/** ЧПУ проекта — в одном месте, чтобы ссылки не расходились (ADR-6: без завершающего слеша). */

export function typePath(typeSlug: string, citySlug: string): string {
  return `/arenda-${typeSlug}-v-${citySlug}`;
}

export function categoryPath(categorySlug: string): string {
  return `/katalog/${categorySlug}`;
}

export function servicePath(serviceSlug: string): string {
  return `/uslugi/${serviceSlug}`;
}
