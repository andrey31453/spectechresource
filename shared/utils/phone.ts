/**
 * Телефон из формы → канонический вид `+7XXXXXXXXXX`.
 *
 * Понимает любые разделители, 10 цифр без кода страны и 11 цифр с ведущими 7/8.
 * Если цифр не 10 и не 11, возвращает `+` и то, что набрано, — валидатор формата
 * отклонит такой номер с понятным сообщением, а не подставит чужой код молча.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }

  return digits ? `+${digits}` : "";
}

/** Годный для CRM номер: ровно `+7` и 10 цифр. */
export function isNormalizedPhone(value: string): boolean {
  return /^\+7\d{10}$/.test(value);
}
