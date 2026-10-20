import { describe, expect, it } from "vitest";
import {
  goalSchema,
  studySessionSchema,
  studySessionUpdateSchema,
  studySeriesSchema,
} from "@/lib/validation";

const validSession = {
  title: "مرور ریاضی",
  kind: "study",
  priority: "medium",
  sessionDate: "2026-10-19",
  startTime: "16:00",
  endTime: "17:30",
  reminderMinutes: "15",
};

describe("studySessionUpdateSchema", () => {
  it("loads at runtime and applies the default scope", () => {
    const result = studySessionUpdateSchema.safeParse({
      ...validSession,
      id: "session-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scope).toBe("single");
      expect(result.data.reminderMinutes).toBe(15);
    }
  });

  it("accepts explicit scopes and rejects unknown ones", () => {
    expect(
      studySessionUpdateSchema.safeParse({
        ...validSession,
        id: "session-1",
        scope: "future",
      }).success,
    ).toBe(true);
    expect(
      studySessionUpdateSchema.safeParse({
        ...validSession,
        id: "session-1",
        scope: "everything",
      }).success,
    ).toBe(false);
  });

  it("rejects an end time that is not after the start", () => {
    const same = studySessionUpdateSchema.safeParse({
      ...validSession,
      id: "session-1",
      endTime: "16:00",
    });
    expect(same.success).toBe(false);
    if (!same.success) {
      expect(same.error.issues.some((issue) => issue.path.includes("endTime"))).toBe(true);
    }

    const earlier = studySessionSchema.safeParse({
      ...validSession,
      startTime: "18:00",
      endTime: "17:00",
    });
    expect(earlier.success).toBe(false);
  });

  it("requires a usable title and valid date/time", () => {
    expect(studySessionSchema.safeParse({ ...validSession, title: "x" }).success).toBe(false);
    expect(studySessionSchema.safeParse({ ...validSession, sessionDate: "2026-02-30" }).success).toBe(false);
    expect(studySessionSchema.safeParse({ ...validSession, startTime: "25:00" }).success).toBe(false);
  });
});

describe("studySeriesSchema", () => {
  const validSeries = {
    title: "برنامهٔ هفتگی",
    kind: "revision",
    priority: "high",
    startDate: "2026-10-17",
    endDate: "2026-11-17",
    weekdays: [6],
    startTime: "17:00",
    durationMinutes: "90",
    reminderMinutes: 15,
  };

  it("accepts a valid recurring plan", () => {
    const result = studySeriesSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.durationMinutes).toBe(90);
  });

  it("requires at least one weekday and a forward date range", () => {
    expect(studySeriesSchema.safeParse({ ...validSeries, weekdays: [] }).success).toBe(false);
    expect(
      studySeriesSchema.safeParse({ ...validSeries, endDate: "2026-10-16" }).success,
    ).toBe(false);
    expect(
      studySeriesSchema.safeParse({ ...validSeries, durationMinutes: 5 }).success,
    ).toBe(false);
  });
});

describe("goalSchema", () => {
  const validGoal = {
    title: "هفته‌ای ده ساعت",
    metric: "study-minutes",
    period: "weekly",
    targetValue: "600",
    startDate: "2026-10-17",
    endDate: "",
  };

  it("coerces numeric input and normalizes an empty end date", () => {
    const result = goalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetValue).toBe(600);
      expect(result.data.endDate).toBeNull();
    }
  });

  it("rejects non-positive targets and inverted ranges", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetValue: "0" }).success).toBe(false);
    expect(
      goalSchema.safeParse({ ...validGoal, endDate: "2026-10-01" }).success,
    ).toBe(false);
  });

  it("only allows percentage targets for exam averages", () => {
    expect(
      goalSchema.safeParse({
        ...validGoal,
        metric: "exam-average",
        targetValue: "105",
      }).success,
    ).toBe(false);
    expect(
      goalSchema.safeParse({
        ...validGoal,
        metric: "exam-average",
        targetValue: "85",
      }).success,
    ).toBe(true);
  });
});
