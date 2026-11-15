import { describe, expect, it } from "vitest";
import { isNormalizedPhone, normalizePhone } from "#shared/utils/phone";
import { telHref } from "~/utils/phone";

describe("normalizePhone", () => {
  it("форматированный номер с +7 приводит к +7XXXXXXXXXX", () => {
    expect(normalizePhone("+7 (999) 123-45-67")).toBe("+79991234567");
  });

  it("ведущая 8 меняется на 7", () => {
    expect(normalizePhone("8 (800) 555-35-35")).toBe("+78005553535");
    expect(normalizePhone("8 999 123 45 67")).toBe("+79991234567");
  });

  it("10 цифр без кода страны получают код 7", () => {
    expect(normalizePhone("9991234567")).toBe("+79991234567");
    expect(normalizePhone("495 000-00-00")).toBe("+74950000000");
  });

  it("неполный номер не выдаёт себя за валидный", () => {
    expect(normalizePhone("123")).toBe("+123");
    expect(isNormalizedPhone(normalizePhone("123"))).toBe(false);
  });

  it("пустая строка остаётся пустой", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("  ( ) - ")).toBe("");
  });

  it("isNormalizedPhone принимает только +7 и 10 цифр", () => {
    expect(isNormalizedPhone("+79991234567")).toBe(true);
    expect(isNormalizedPhone("79991234567")).toBe(false);
    expect(isNormalizedPhone("+7999123456")).toBe(false);
  });
});

describe("telHref", () => {
  it("форматированный номер приводит к tel:+7XXXXXXXXXX", () => {
    expect(telHref("+7 (495) 000-00-00")).toBe("tel:+74950000000");
  });

  it("номер с ведущей 8 меняет её на 7", () => {
    expect(telHref("8 800 555-35-35")).toBe("tel:+78005553535");
  });

  it("номер только из цифр тоже работает", () => {
    expect(telHref("+79991234567")).toBe("tel:+79991234567");
  });

  it("городской номер из 10 цифр получает код 7", () => {
    expect(telHref("495 000-00-00")).toBe("tel:+74950000000");
  });
});
