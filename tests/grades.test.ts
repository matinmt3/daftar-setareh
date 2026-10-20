import { describe, expect, it } from "vitest";
import type { Exam, Subject } from "@/lib/types";
import {
  buildSubjectStats,
  examPercent,
  gradeDistribution,
  linearTrend,
  overallAverage,
  percentChange,
  subjectAverage,
  weightedAverage,
} from "@/lib/grades";

const subject: Subject = {
  id: "subject-1",
  userId: "user-1",
  name: "ریاضی",
  color: "violet",
  icon: "calculator",
  isArchived: false,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

function exam(overrides: Partial<Exam> & Pick<Exam, "id" | "grade" | "maxGrade">): Exam {
  return {
    userId: "user-1",
    subjectId: subject.id,
    title: overrides.title ?? "آزمون",
    examDate: overrides.examDate ?? "2026-10-01",
    weight: overrides.weight ?? null,
    notes: null,
    createdAt: overrides.createdAt ?? "2026-10-01T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("examPercent", () => {
  it("normalizes a grade against its own maximum", () => {
    expect(examPercent({ grade: 17.5, maxGrade: 20 })).toBe(87.5);
    expect(examPercent({ grade: 85, maxGrade: 100 })).toBe(85);
  });

  it("keeps an earned zero but rejects invalid or missing grades", () => {
    expect(examPercent({ grade: 0, maxGrade: 20 })).toBe(0);
    expect(examPercent({ grade: null, maxGrade: 20 })).toBeNull();
    expect(examPercent({ grade: 21, maxGrade: 20 })).toBeNull();
    expect(examPercent({ grade: -1, maxGrade: 20 })).toBeNull();
    expect(examPercent({ grade: 10, maxGrade: 0 })).toBeNull();
    expect(examPercent({ grade: Number.NaN, maxGrade: 20 })).toBeNull();
  });
});

describe("subjectAverage", () => {
  it("uses a simple average when no weights are set", () => {
    const result = subjectAverage([
      exam({ id: "a", grade: 20, maxGrade: 20 }),
      exam({ id: "b", grade: 10, maxGrade: 20 }),
    ]);
    expect(result).toEqual({ percent: 75, weighted: false, count: 2 });
  });

  it("uses a weighted average when any weight exists", () => {
    const result = subjectAverage([
      exam({ id: "a", grade: 20, maxGrade: 20, weight: 1 }),
      exam({ id: "b", grade: 10, maxGrade: 20, weight: 2 }),
    ]);
    expect(result.weighted).toBe(true);
    expect(result.percent).toBe(200 / 3);
    expect(result.count).toBe(2);
  });

  it("treats a null weight as 1 inside a weighted subject", () => {
    expect(
      weightedAverage([
        { percent: 100, weight: null },
        { percent: 50, weight: 2 },
      ]),
    ).toBe(200 / 3);
  });

  it("excludes invalid grades and handles no valid entries", () => {
    const result = subjectAverage([
      exam({ id: "a", grade: null, maxGrade: 20 }),
      exam({ id: "b", grade: 10, maxGrade: 20 }),
    ]);
    expect(result).toEqual({ percent: 50, weighted: false, count: 1 });
    expect(subjectAverage([exam({ id: "c", grade: 25, maxGrade: 20 })])).toEqual({
      percent: null,
      weighted: false,
      count: 0,
    });
  });
});

describe("averages and changes", () => {
  it("averages only finite values", () => {
    expect(overallAverage([80, null, 60, Number.NaN])).toBe(70);
    expect(overallAverage([null, Number.NaN])).toBeNull();
  });

  it("rounds period changes to one decimal", () => {
    expect(percentChange(82.44, 70)).toBe(12.4);
    expect(percentChange(70, 82.44)).toBe(-12.4);
    expect(percentChange(null, 70)).toBeNull();
    expect(percentChange(70, null)).toBeNull();
  });
});

describe("linearTrend", () => {
  it("requires at least three points", () => {
    expect(
      linearTrend([
        { percent: 50, date: "2026-10-01" },
        { percent: 70, date: "2026-10-02" },
      ]),
    ).toEqual({ direction: "insufficient", slope: null, sampleSize: 2 });
  });

  it("detects rising, falling, and stable trends regardless of input order", () => {
    const points = [
      { percent: 70, date: "2026-10-03" },
      { percent: 50, date: "2026-10-01" },
      { percent: 60, date: "2026-10-02" },
    ];
    expect(linearTrend(points).direction).toBe("up");
    expect(linearTrend(points).slope).toBe(10);
    expect(
      linearTrend([
        { percent: 90, date: "2026-10-01" },
        { percent: 80, date: "2026-10-02" },
        { percent: 70, date: "2026-10-03" },
      ]).direction,
    ).toBe("down");
    expect(
      linearTrend([
        { percent: 60, date: "2026-10-01" },
        { percent: 60.4, date: "2026-10-02" },
        { percent: 60.2, date: "2026-10-03" },
      ]).direction,
    ).toBe("stable");
  });
});

describe("buildSubjectStats", () => {
  it("computes period, all-time, latest, and previous-period values", () => {
    const all = [
      exam({ id: "old", grade: 10, maxGrade: 20, examDate: "2026-09-01" }),
      exam({ id: "a", grade: 15, maxGrade: 20, examDate: "2026-10-02" }),
      exam({ id: "b", grade: 18, maxGrade: 20, examDate: "2026-10-12" }),
      exam({ id: "pending", grade: null, maxGrade: 20, examDate: "2026-10-13" }),
    ];
    const current = all.filter((item) => item.examDate >= "2026-10-01");
    const previous = all.filter((item) => item.examDate < "2026-10-01");
    const stats = buildSubjectStats([subject], current, 20, all, previous);
    expect(stats).toHaveLength(1);
    const [row] = stats;
    expect(row.examCount).toBe(2);
    expect(row.averagePercent).toBe(82.5);
    expect(row.scaleValue).toBe(16.5);
    expect(row.highestPercent).toBe(90);
    expect(row.lowestPercent).toBe(75);
    expect(row.latestPercent).toBe(90);
    expect(row.latestDate).toBe("2026-10-12");
    expect(row.allTimePercent).toBe((50 + 75 + 90) / 3);
    expect(row.changeFromPrevious).toBe(32.5);
  });

  it("omits subjects with no valid grades and archived subjects without exams", () => {
    const other = { ...subject, id: "subject-2", name: "ادبیات" };
    const stats = buildSubjectStats(
      [subject, other],
      [exam({ id: "x", grade: 20, maxGrade: 20 })],
      20,
    );
    expect(stats.map((item) => item.subjectId)).toEqual(["subject-1"]);
  });
});

describe("gradeDistribution", () => {
  it("assigns each percent into exactly one bucket", () => {
    const buckets = gradeDistribution([0, 49.9, 50, 69.9, 70, 84.9, 85, 100]);
    expect(buckets.map((bucket) => bucket.count)).toEqual([2, 2, 2, 2]);
  });

  it("ignores values outside zero to one hundred", () => {
    const buckets = gradeDistribution([-1, 101]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(0);
  });
});
