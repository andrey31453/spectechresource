import { normalizePhone } from "#shared/utils/phone";

/** Телефон из настроек («+7 (495) 000-00-00») → ссылка tel:+74950000000. */
export function telHref(phone: string): string {
  return `tel:${normalizePhone(phone)}`;
}
