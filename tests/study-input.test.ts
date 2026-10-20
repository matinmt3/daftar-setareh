import { describe, expect, it } from "vitest";
import { parseStudyMinutes } from "../src/lib/study-input";

describe("study duration entered in the report form", () => {
  it("accepts Persian, Arabic and Latin whole minutes without changing their value", () => {
    expect(parseStudyMinutes("۴۵")).toBe(45);
    expect(parseStudyMinutes("٦٠")).toBe(60);
    expect(parseStudyMinutes(" 120 ")).toBe(120);
    expect(parseStudyMinutes("")).toBe(0);
    expect(parseStudyMinutes("۱۴۴۰")).toBe(1440);
  });
  it.each(["-30", "−۳۰", "1.5", "۱٫۵", "1e2", "20 minutes", "1,000", "1441", "9".repeat(40)])("rejects %s instead of converting it to a different duration", (input) => {
    expect(parseStudyMinutes(input)).toBeNull();
  });
});
