import { describe, expect, it } from "vitest";
import { telHref } from "~/utils/phone";

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
});
