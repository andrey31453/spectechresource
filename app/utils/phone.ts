/** Телефон из настроек («+7 (495) 000-00-00») → ссылка tel:+74950000000. */
export function telHref(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  return `tel:+${digits}`;
}
