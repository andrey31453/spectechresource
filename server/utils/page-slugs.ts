import type { PrismaClient } from "../../generated/prisma/client";
import { saveSlugRedirect, type SlugRedirect } from "./catalog-slugs";

/**
 * Смена кода статической страницы: старый корневой адрес должен отвечать 301 на новый,
 * а не 404 (ADR-6). Запись в `Redirect` и сброс кэша — те же, что у каталога.
 */

export function pageSlugRedirect(oldSlug: string, newSlug: string): SlugRedirect | null {
  if (oldSlug === newSlug) return null;

  return { from: `/${oldSlug}`, to: `/${newSlug}` };
}

export async function savePageSlugRedirect(
  prisma: PrismaClient,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  await saveSlugRedirect(prisma, pageSlugRedirect(oldSlug, newSlug));
}
