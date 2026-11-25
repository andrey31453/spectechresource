import type { PrismaClient } from "../../generated/prisma/client";
import { invalidateRedirectCache } from "./redirects";

/**
 * Смена кода (slug) публичной страницы: старый адрес должен отвечать 301 на новый,
 * а не 404 (ADR-6). Правила путей — те же, что в `app/utils/routes.ts`.
 */

export interface SlugRedirect {
  from: string;
  to: string;
}

export function categorySlugRedirect(oldSlug: string, newSlug: string): SlugRedirect | null {
  if (oldSlug === newSlug) return null;

  return { from: `/katalog/${oldSlug}`, to: `/katalog/${newSlug}` };
}

/** Услуга живёт в разделе `/uslugi/{slug}` — старый адрес после смены кода ведёт 301 на новый. */
export function serviceSlugRedirect(oldSlug: string, newSlug: string): SlugRedirect | null {
  if (oldSlug === newSlug) return null;

  return { from: `/uslugi/${oldSlug}`, to: `/uslugi/${newSlug}` };
}

/**
 * Запись редиректа и сброс кэша таблицы `redirects` — иначе старый адрес
 * продолжит отдавать 404 ещё до минуты (TTL кэша в `redirects.ts`).
 */
export async function saveSlugRedirect(prisma: PrismaClient, redirect: SlugRedirect | null): Promise<void> {
  if (!redirect) return;

  await prisma.redirect.upsert({
    where: { from: redirect.from },
    update: { to: redirect.to, statusCode: 301 },
    create: { from: redirect.from, to: redirect.to, statusCode: 301 },
  });

  invalidateRedirectCache();
}
