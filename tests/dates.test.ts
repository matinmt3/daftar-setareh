import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  addMonthsISO,
  analyticsRange,
  diffDaysISO,
  durationBetween,
  formatNumericDate,
  isValidISODate,
  minutesToTime,
  monthRange,
  timeToMinutes,
  todayISO,
  weekRange,
} from "@/lib/dates";

describe("Jalali date handling", () => {
  it("converts the anchored Gregorian date to the expected Jalali date", () => {
    expect(formatNumericDate("2026-10-19")).toBe("1405/07/27");
  });

  it("treats Saturday as the start of the week", () => {
    expect(weekRange("2026-10-19")).toEqual({
      start: "2026-10-17",
      end: "2026-10-23",
    });
  });

  it("handles Saturday and Friday boundaries", () => {
    expect(weekRange("2026-10-17").start).toBe("2026-10-17");
    expect(weekRange("2026-10-23").end).toBe("2026-10-23");
    expect(addDaysISO("2026-10-23", 1)).toBe("2026-10-24");
  });

  it("validates ISO dates strictly", () => {
    expect(isValidISODate("2026-10-19")).toBe(true);
    expect(isValidISODate("2026-02-29")).toBe(false);
    expect(isValidISODate("2024-02-29")).toBe(true);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("19/10/2026")).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
  });

  it("computes day differences in both directions", () => {
    expect(diffDaysISO("2026-10-17", "2026-10-19")).toBe(2);
    expect(diffDaysISO("2026-10-19", "2026-10-17")).toBe(-2);
    expect(diffDaysISO("2026-10-19", "2026-10-19")).toBe(0);
  });

  it("moves across Jalali month boundaries", () => {
    expect(addMonthsISO("2026-10-19", 1)).toBe("2026-11-18");
    expect(addMonthsISO("2026-10-19", -1)).toBe("2026-09-18");
    expect(monthRange("2026-10-19").start).toBe("2026-09-23");
    expect(monthRange("2026-10-19").end).toBe("2026-10-22");
  });
});

describe("time helpers", () => {
  it("round-trips minutes and times", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(minutesToTime(510)).toBe("08:30");
    expect(minutesToTime(1500)).toBe("01:00");
    expect(durationBetween("14:15", "15:45")).toBe(90);
    expect(durationBetween("15:45", "14:15")).toBe(0);
  });

  it("provides a valid Tehran today", () => {
    expect(isValidISODate(todayISO())).toBe(true);
  });
});

describe("analyticsRange", () => {
  it("builds rolling windows including today", () => {
    const range = analyticsRange("last-30", "2026-10-19");
    expect(range).toEqual({ start: "2026-09-20", end: "2026-10-19" });
    expect(diffDaysISO(range.start, range.end) + 1).toBe(30);
  });

  it("keeps the all-time lower bound stable", () => {
    expect(analyticsRange("all", "2026-10-19")).toEqual({
      start: "2020-01-01",
      end: "2026-10-19",
    });
  });
});
