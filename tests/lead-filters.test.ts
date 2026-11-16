import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  LEAD_PAGE_MAX,
  LEAD_PAGE_SIZE,
  LeadFiltersSchema,
  emptyLeadFilters,
  leadCreatedAtRange,
  leadDayEnd,
  leadDayStart,
  leadSearchTerms,
} from "#shared/schemas/leads-filters";
import { leadPagination, toLeadWhere } from "~~/server/utils/leads-filter";

function parse(query: Record<string, unknown>) {
  return v.parse(LeadFiltersSchema, query);
}

function issuePaths(query: Record<string, unknown>): string[] {
  const result = v.safeParse(LeadFiltersSchema, query);
  if (result.success) return [];

  return result.issues.map((issue) => (issue.path ?? []).map((item) => String(item.key)).join("."));
}

describe("LeadFiltersSchema", () => {
  it("пустой запрос — все заявки, первая страница", () => {
    expect(parse({})).toEqual({
      status: "all",
      place: null,
      from: null,
      to: null,
      q: null,
      page: 1,
      pageSize: LEAD_PAGE_SIZE.default,
    });
  });

  it("пустой статус и «all» значат «все», неизвестный — ошибка поля", () => {
    expect(parse({ status: "" }).status).toBe("all");
    expect(parse({ status: " all " }).status).toBe("all");
    expect(parse({ status: "NEW" }).status).toBe("NEW");
    expect(issuePaths({ status: "LOST" })).toEqual(["status"]);
  });

  it("место формы проверяется по списку блоков", () => {
    expect(parse({ place: "equipment" }).place).toBe("equipment");
    expect(parse({ place: "" }).place).toBeNull();
    expect(issuePaths({ place: "popup" })).toEqual(["place"]);
  });

  it("даты принимаются только реальные и в формате ГГГГ-ММ-ДД", () => {
    expect(parse({ from: "2026-11-01", to: "2026-11-16" })).toMatchObject({
      from: "2026-11-01",
      to: "2026-11-16",
    });
    expect(issuePaths({ from: "01.11.2026" })).toContain("from");
    expect(issuePaths({ from: "2026-02-31" })).toContain("from");
    expect(issuePaths({ from: "2026-11-20", to: "2026-11-10" })).toEqual(["to"]);
  });

  it("поиск обрезает пробелы и ограничен по длине", () => {
    expect(parse({ q: "  Иван  " }).q).toBe("Иван");
    expect(parse({ q: "   " }).q).toBeNull();
    expect(issuePaths({ q: "я".repeat(101) })).toEqual(["q"]);
  });

  it("страница и размер страницы приводятся к допустимым значениям", () => {
    expect(parse({ page: "3", pageSize: "50" })).toMatchObject({ page: 3, pageSize: 50 });
    expect(parse({ page: "0" }).page).toBe(1);
    expect(parse({ page: "abc" }).page).toBe(1);
    expect(parse({ pageSize: "1000" }).pageSize).toBe(LEAD_PAGE_SIZE.max);
    expect(parse({ pageSize: "1" }).pageSize).toBe(LEAD_PAGE_SIZE.min);
    expect(parse({ page: "999999" }).page).toBe(LEAD_PAGE_MAX);
    expect(parse({ page: "-5" }).page).toBe(1);
  });

  it("пустые фильтры совпадают со схемой по умолчанию", () => {
    expect(parse(emptyLeadFilters())).toEqual(emptyLeadFilters());
  });
});

describe("границы суток по Москве", () => {
  it("начало и конец дня — UTC+3", () => {
    expect(leadDayStart("2026-11-16")?.toISOString()).toBe("2026-11-15T21:00:00.000Z");
    expect(leadDayEnd("2026-11-16")?.toISOString()).toBe("2026-11-16T20:59:59.999Z");
  });

  it("несуществующая дата не превращается в диапазон", () => {
    expect(leadDayStart("2026-13-01")).toBeNull();
    expect(leadDayEnd("2026-11-31")).toBeNull();
  });

  it("диапазон пуст, если даты не выбраны", () => {
    expect(leadCreatedAtRange({ from: null, to: null })).toBeNull();
    expect(leadCreatedAtRange({ from: "2026-11-16", to: null })).toEqual({
      gte: new Date("2026-11-15T21:00:00.000Z"),
    });
    expect(leadCreatedAtRange({ from: null, to: "2026-11-16" })).toEqual({
      lte: new Date("2026-11-16T20:59:59.999Z"),
    });
  });
});

describe("leadSearchTerms", () => {
  it("телефон в любом виде ищется и точно, и по цифрам", () => {
    expect(leadSearchTerms("+7 (999) 123-45-67")).toEqual({
      text: "+7 (999) 123-45-67",
      phone: "+79991234567",
      digits: "79991234567",
    });
    expect(leadSearchTerms("9991234567").phone).toBe("+79991234567");
  });

  it("e-mail и имя — только текстовый поиск", () => {
    expect(leadSearchTerms("ivan@example.ru")).toEqual({
      text: "ivan@example.ru",
      phone: null,
      digits: null,
    });
    expect(leadSearchTerms("Иван")).toEqual({ text: "Иван", phone: null, digits: null });
  });

  it("пустая строка не создаёт условий", () => {
    expect(leadSearchTerms(null)).toEqual({ text: null, phone: null, digits: null });
    expect(leadSearchTerms("   ").text).toBeNull();
  });
});

describe("toLeadWhere", () => {
  it("«все заявки» без дат и поиска — пустое условие", () => {
    expect(toLeadWhere(emptyLeadFilters())).toEqual({});
  });

  it("статус, место и даты попадают в условие", () => {
    expect(toLeadWhere(parse({ status: "FAILED", place: "hero", from: "2026-11-01", to: "2026-11-16" }))).toEqual({
      status: "FAILED",
      place: "hero",
      createdAt: {
        gte: new Date("2026-10-31T21:00:00.000Z"),
        lte: new Date("2026-11-16T20:59:59.999Z"),
      },
    });
  });

  it("поиск по телефону добавляет точное совпадение и цифры", () => {
    const where = toLeadWhere(parse({ q: "+7 (999) 123-45-67" }));

    expect(where.OR).toEqual([
      { name: { contains: "+7 (999) 123-45-67", mode: "insensitive" } },
      { email: { contains: "+7 (999) 123-45-67", mode: "insensitive" } },
      { phone: "+79991234567" },
      { phone: { contains: "79991234567" } },
    ]);
  });

  it("поиск по имени не трогает телефон", () => {
    const where = toLeadWhere(parse({ q: "Иван" }));

    expect(where.OR).toHaveLength(2);
    expect(where.OR?.some((condition) => "phone" in condition)).toBe(false);
  });
});

describe("leadPagination", () => {
  it("skip считается от страницы и размера", () => {
    expect(leadPagination(parse({ page: "2", pageSize: "50" }))).toEqual({
      page: 2,
      pageSize: 50,
      skip: 50,
      take: 50,
    });
  });
});
