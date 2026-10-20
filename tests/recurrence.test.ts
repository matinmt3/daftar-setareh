import { describe, expect, it } from "vitest";
import {
  generateRecurrenceDates,
  MAX_RECURRENCE_DAYS,
  MAX_RECURRENCE_OCCURRENCES,
} from "@/lib/recurrence";

describe("generateRecurrenceDates", () => {
  it("generates the selected weekday across the range", () => {
    expect(
      generateRecurrenceDates({
        startDate: "2026-10-17",
        endDate: "2026-10-30",
        weekdays: [6],
      }),
    ).toEqual(["2026-10-17", "2026-10-24"]);
  });

  it("de-duplicates weekdays and supports multiple days", () => {
    expect(
      generateRecurrenceDates({
        startDate: "2026-10-17",
        endDate: "2026-10-19",
        weekdays: [6, 6, 0, 1],
      }),
    ).toEqual(["2026-10-17", "2026-10-18", "2026-10-19"]);
  });

  it("returns nothing for an inverted range or empty selection", () => {
    expect(
      generateRecurrenceDates({
        startDate: "2026-10-20",
        endDate: "2026-10-19",
        weekdays: [6],
      }),
    ).toEqual([]);
    expect(
      generateRecurrenceDates({
        startDate: "2026-10-17",
        endDate: "2026-10-30",
        weekdays: [],
      }),
    ).toEqual([]);
    expect(
      generateRecurrenceDates({
        startDate: "2026-10-17",
        endDate: "2026-10-30",
        weekdays: [9, -1],
      }),
    ).toEqual([]);
  });

  it("caps the generation horizon and never exceeds the occurrence limit", () => {
    const dates = generateRecurrenceDates({
      startDate: "2026-01-01",
      endDate: "2027-12-31",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(dates.length).toBe(MAX_RECURRENCE_DAYS + 1);
    expect(dates.length).toBeLessThanOrEqual(MAX_RECURRENCE_OCCURRENCES);
    expect(dates[0]).toBe("2026-01-01");
    expect(dates.at(-1)).toBe("2026-05-01");
  });
});
