/** ЧПУ проекта — в одном месте, чтобы ссылки не расходились (ADR-6: без завершающего слеша). */

export function typePath(typeSlug: string, _citySlug?: string): string {
  return `/arenda-${typeSlug}`;
}

export function modelPath(typeSlug: string, modelSlug: string): string {
  return `${typePath(typeSlug)}/${modelSlug}`;
}

export function categoryPath(categorySlug: string): string {
  return `/katalog/${categorySlug}`;
}

export function servicePath(serviceSlug: string): string {
  return `/uslugi/${serviceSlug}`;
}
