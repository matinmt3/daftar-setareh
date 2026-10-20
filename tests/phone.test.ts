import { describe, expect, it } from "vitest";
import { isValidIranianPhone, normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it("accepts common Iranian mobile formats", () => {
    expect(normalizePhone("09121234567")).toBe("09121234567");
    expect(normalizePhone("۰۹۱۲ ۱۲۳ ۴۵۶۷")).toBe("09121234567");
    expect(normalizePhone("+98 912 123 4567")).toBe("09121234567");
    expect(normalizePhone("00989121234567")).toBe("09121234567");
    expect(normalizePhone("989121234567")).toBe("09121234567");
    expect(normalizePhone("9121234567")).toBe("09121234567");
    expect(normalizePhone("(0912) 123-4567")).toBe("09121234567");
  });

  it("rejects landlines, short numbers, and invalid prefixes", () => {
    expect(normalizePhone("02112345678")).toBeNull();
    expect(normalizePhone("0912123456")).toBeNull();
    expect(normalizePhone("08121234567")).toBeNull();
    expect(normalizePhone("hello")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null as unknown as string)).toBeNull();
  });

  it("exposes the boolean validator", () => {
    expect(isValidIranianPhone("09351234567")).toBe(true);
    expect(isValidIranianPhone("0935123456")).toBe(false);
  });
});
