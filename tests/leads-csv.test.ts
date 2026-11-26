import { describe, expect, it } from "vitest";
import { csvFileName, escapeCsvCell, toCsv } from "#shared/utils/csv";
import { formatLeadDateTime } from "#shared/utils/leads-format";
import { LEAD_CSV_HEADERS, leadToCsvRow, leadsToCsv, type LeadCsvSource } from "~~/server/utils/leads-csv";

describe("escapeCsvCell", () => {
  it("обычный текст остаётся как есть", () => {
    expect(escapeCsvCell("Иван")).toBe("Иван");
    expect(escapeCsvCell("")).toBe("");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("разделитель, кавычки и перевод строки берутся в кавычки", () => {
    expect(escapeCsvCell("Москва; область")).toBe('"Москва; область"');
    expect(escapeCsvCell('ООО "Ромашка"')).toBe('"ООО ""Ромашка"""');
    expect(escapeCsvCell("строка 1\nстрока 2")).toBe('"строка 1\nстрока 2"');
  });

  it("формулы обезвреживаются апострофом (CSV-injection)", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+79991234567")).toBe("'+79991234567");
    expect(escapeCsvCell("-5")).toBe("'-5");
    expect(escapeCsvCell("@user")).toBe("'@user");
  });

  it("кавычки внутри формулы экранируются вместе с защитой", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil";"x")')).toBe('"\'=HYPERLINK(""http://evil"";""x"")"');
  });
});

describe("toCsv", () => {
  it("ставит BOM, разделитель и CRLF", () => {
    expect(toCsv([["a", "b"], ["1", "2"]])).toBe("\uFEFFa;b\r\n1;2\r\n");
  });

  it("поддерживает запятую и отключение BOM", () => {
    expect(toCsv([["a", "b"]], { delimiter: ",", bom: false })).toBe("a,b\r\n");
  });

  it("пустая таблица — только BOM", () => {
    expect(toCsv([])).toBe("\uFEFF");
    expect(toCsv([], { bom: false })).toBe("");
  });
});

describe("csvFileName", () => {
  it("содержит дату выгрузки", () => {
    expect(csvFileName("leads", new Date("2026-11-16T20:00:00.000Z"))).toBe("leads-2026-11-16.csv");
  });
});

describe("formatLeadDateTime", () => {
  it("показывает московское время", () => {
    expect(formatLeadDateTime(new Date("2026-11-16T08:05:00.000Z"))).toBe("16.11.2026, 11:05");
    expect(formatLeadDateTime("2026-11-16T08:05:00.000Z")).toBe("16.11.2026, 11:05");
  });

  it("пустая дата — пустая строка", () => {
    expect(formatLeadDateTime(null)).toBe("");
    expect(formatLeadDateTime("не дата")).toBe("");
  });
});

const lead: LeadCsvSource = {
  id: "lead1",
  createdAt: new Date("2026-11-16T08:05:00.000Z"),
  status: "FAILED",
  name: "ООО \"Ромашка\"",
  phone: "+79991234567",
  email: "ivan@example.ru",
  comment: "Нужен экскаватор; срочно",
  place: "equipment",
  pageUrl: "https://spectech.example/katalog",
  pageTitle: "Каталог",
  utmSource: "yandex",
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  consentAt: new Date("2026-11-16T08:05:00.000Z"),
  consentVersion: "2026-11-15",
  attempts: 3,
  sentAt: null,
  crmLeadId: null,
  errorText: "HTTP 502",
  referer: "https://yandex.ru/",
  ip: "192.0.2.10",
  userAgent: "Mozilla/5.0",
  equipmentType: { name: "Гусеничные экскаваторы" },
};

describe("leadsToCsv", () => {
  it("выгружает источник и кнопку в соответствующие столбцы", () => {
    const row = leadToCsvRow({ ...lead, sourceLabel: "Товар: CAT 320", sourceButton: "Заказать" });
    expect(row).toHaveLength(LEAD_CSV_HEADERS.length);
    expect(row[LEAD_CSV_HEADERS.indexOf("Источник")]).toBe("Товар: CAT 320");
    expect(row[LEAD_CSV_HEADERS.indexOf("Кнопка")]).toBe("Заказать");
  });
  it("первая строка — заголовки, дальше по строке на заявку", () => {
    const csv = leadsToCsv([lead]);
    const lines = csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(LEAD_CSV_HEADERS.join(";"));
    expect(lines[1]).toContain("16.11.2026, 11:05");
    expect(lines[1]).toContain("Ошибка");
    expect(lines[1]).toContain("\"ООО \"\"Ромашка\"\"\"");
    expect(lines[1]).toContain("\"Нужен экскаватор; срочно\"");
  });

  it("телефон не превращается в формулу Excel", () => {
    const row = leadToCsvRow(lead);
    const phoneIndex = LEAD_CSV_HEADERS.indexOf("Телефон");

    expect(row[phoneIndex]).toBe("+79991234567");
    expect(leadsToCsv([lead])).toContain("'+79991234567");
  });

  it("пустая выгрузка — только заголовки", () => {
    expect(leadsToCsv([])).toBe(`\uFEFF${LEAD_CSV_HEADERS.join(";")}\r\n`);
  });
});
