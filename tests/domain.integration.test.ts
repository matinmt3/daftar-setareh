import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { closeDatabase, openDatabase, setDatabaseForTests } from "@/server/db/connection";
import { completeOnboarding, createUser } from "@/server/repositories/users";
import { createSubject } from "@/server/repositories/subjects";
import { getReports, getReportsForDate, removeReport, saveReport } from "@/server/services/reports";
import {
  addSeries,
  addSession,
  getSeriesList,
  getSessions,
  removeSession,
  toggleSession,
} from "@/server/services/planner";
import { addGoal, computeGoalProgress, editGoal, removeGoal, toggleGoal } from "@/server/services/goals";
import { todayISO } from "@/lib/dates";

let db: DatabaseSync;
let userId: string;
let subjectId: string;

beforeEach(() => {
  db = openDatabase(":memory:");
  setDatabaseForTests(db);
  const user = createUser("09121234567", { name: "ستاره" });
  userId = user.id;
  completeOnboarding(userId, {
    name: "ستاره",
    gradeLevel: 10,
    field: "math",
    gradeScale: 20,
    dailyGoalMinutes: 120,
  });
  subjectId = createSubject({
    userId,
    name: "ریاضی",
    color: "violet",
    icon: "calculator",
  }).id;
});

afterEach(() => {
  closeDatabase();
});

function reportInput(date: string) {
  return {
    reportDate: date,
    entryIndex: 0,
    allowAdditional: false,
    subjects: [
      { subjectId, minutes: 90, note: "فصل دو" },
      { subjectId, minutes: 0, note: "" },
    ],
    tasks: [
      { subjectId, title: "تمرین ۱", status: "completed" as const },
      { subjectId: null, title: "مرور لغات", status: "pending" as const },
    ],
    lessonsReviewed: "مشتق",
    exercises: "تمرین‌های ۱ تا ۱۰",
    difficulties: "",
    reflection: "",
    nextDayGoals: "",
  };
}

describe("daily report persistence", () => {
  it("saves filtered subject rows and tasks, then builds summaries", () => {
    const report = saveReport(userId, reportInput("2026-10-19"));
    expect(report.entryIndex).toBe(0);
    expect(report.subjects).toHaveLength(1);
    expect(report.subjects[0]?.minutes).toBe(90);
    expect(report.tasks).toHaveLength(2);

    const summaries = getReports(userId);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      entryIndex: 0,
      minutes: 90,
      completedTasks: 1,
      pendingTasks: 1,
      subjectCount: 1,
    });
  });

  it("blocks a same-day duplicate unless an additional report is requested", () => {
    saveReport(userId, reportInput("2026-10-19"));
    expect(() => saveReport(userId, reportInput("2026-10-19"))).toThrow();

    const additional = saveReport(userId, {
      ...reportInput("2026-10-19"),
      allowAdditional: true,
    });
    expect(additional.entryIndex).toBe(1);
    expect(getReportsForDate(userId, "2026-10-19")).toHaveLength(2);
  });

  it("updates and deletes a report within the owner's scope", () => {
    const report = saveReport(userId, reportInput("2026-10-19"));
    const updated = saveReport(userId, {
      ...reportInput("2026-10-20"),
      id: report.id,
      subjects: [{ subjectId, minutes: 45, note: "بازنگری" }],
    });
    expect(updated.reportDate).toBe("2026-10-20");
    expect(updated.subjects[0]?.minutes).toBe(45);

    removeReport(userId, report.id);
    expect(getReports(userId)).toHaveLength(0);
  });
});

describe("planner recurrence and goals", () => {
  it("creates a recurring series, toggles completion, and removes the series", () => {
    const { series, created } = addSeries(userId, {
      subjectId,
      title: "مرور هفتگی ریاضی",
      kind: "revision",
      priority: "medium",
      notes: "",
      startDate: "2026-10-17",
      endDate: "2026-10-30",
      weekdays: [6],
      startTime: "16:00",
      durationMinutes: 60,
      reminderMinutes: 15,
    });
    expect(created).toBe(2);
    expect(getSeriesList(userId)).toHaveLength(1);

    const sessions = getSessions(userId, { seriesId: series.id });
    expect(sessions.map((session) => session.sessionDate)).toEqual([
      "2026-10-17",
      "2026-10-24",
    ]);
    expect(sessions[0]?.endTime).toBe("17:00");

    const completed = toggleSession(userId, sessions[0]!.id, true);
    expect(completed.status).toBe("completed");

    removeSession(userId, sessions[0]!.id, "series");
    expect(getSeriesList(userId)).toHaveLength(0);
    expect(getSessions(userId)).toHaveLength(0);
  });

  it("adds a one-off session and computes its stored duration", () => {
    const session = addSession(userId, {
      subjectId,
      title: "حل تمرین",
      kind: "homework",
      priority: "high",
      notes: "",
      sessionDate: "2026-10-19",
      startTime: "18:10",
      endTime: "19:25",
      reminderMinutes: 10,
    });
    expect(session.durationMinutes).toBe(75);
    expect(session.seriesId).toBeNull();
  });

  it("tracks, edits, pauses, and deletes a goal", () => {
    const goal = addGoal(userId, {
      title: "هر روز ۹۰ دقیقه",
      metric: "study-minutes",
      period: "daily",
      targetValue: 90,
      startDate: todayISO(),
      endDate: null,
    });
    saveReport(userId, reportInput(todayISO()));

    const progress = computeGoalProgress(userId, goal, 20);
    expect(progress.currentValue).toBe(90);
    expect(progress.achieved).toBe(true);
    expect(progress.percent).toBe(100);

    const edited = editGoal(userId, {
      id: goal.id,
      title: "هر روز دو ساعت",
      metric: "study-minutes",
      period: "daily",
      targetValue: 120,
      startDate: goal.startDate,
      endDate: null,
    });
    expect(edited.targetValue).toBe(120);

    toggleGoal(userId, goal.id, false);
    removeGoal(userId, goal.id);
  });
});
