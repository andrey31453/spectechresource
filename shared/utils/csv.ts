/**
 * CSV для выгрузок админки (Excel, LibreOffice, «Мой офис»).
 *
 * - BOM в начале: без него Excel открывает UTF-8 как cp1251 и ломает кириллицу.
 * - `;` по умолчанию: русская локаль Excel считает разделителем точку с запятой,
 *   иначе вся строка попадает в одну колонку.
 * - Переводы строк CRLF — как требует RFC 4180.
 * - Защита от CSV-injection: ячейка, начинающаяся с `=`, `+`, `-`, `@`, таба или CR,
 *   в Excel выполняется как формула. Ведущий апостроф делает её текстом и в ячейке не виден.
 */

/** Первые символы, с которых Excel/Sheets начинают разбор формулы. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export interface CsvOptions {
  /** Разделитель колонок; по умолчанию `;` — для русского Excel. */
  delimiter?: string;
  /** BOM для корректной кириллицы; по умолчанию включён. */
  bom?: boolean;
}

/** Одна ячейка: защита от формул и экранирование кавычек/разделителей/переводов строк. */
export function escapeCsvCell(value: unknown, delimiter = ";"): string {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = FORMULA_PREFIX.test(text) ? `'${text}` : text;
  const needsQuotes = guarded.includes(delimiter) || guarded.includes('"') || /[\r\n]/.test(guarded);

  return needsQuotes ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** Таблица → CSV-текст (по умолчанию с BOM, `;` и CRLF). Пустая таблица — пустая строка. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>, options: CsvOptions = {}): string {
  const { delimiter = ";", bom = true } = options;

  if (rows.length === 0) return bom ? "\uFEFF" : "";

  const body = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter))
    .join("\r\n");

  return `${bom ? "\uFEFF" : ""}${body}\r\n`;
}

/** Имя файла выгрузки: `leads-2026-11-16.csv` (дата — по часам сервера). */
export function csvFileName(prefix: string, date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `${prefix}-${iso}.csv`;
}
