import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeDatabase, getDb, openDatabase, setDatabaseForTests } from "@/server/db/connection";
import { createUser, findUserById, findUserByPhone } from "@/server/repositories/users";
import { createSubject, updateSubjectRecord } from "@/server/repositories/subjects";
import { listSessions } from "@/server/repositories/planner";
import { countActiveGoals } from "@/server/repositories/goals";
import { saveExam } from "@/server/services/exams";
import { saveReport, type ReportInput } from "@/server/services/reports";
import { addSeries, getSeriesList, updateSession } from "@/server/services/planner";
import { addGoal, computeGoalProgress, editGoal, toggleGoal } from "@/server/services/goals";
import { completeUserOnboarding, deleteAccount } from "@/server/services/profile";
import { ensureDemoUser } from "@/server/demo";
import { ensureCard, getCard, getCards } from "@/server/services/cards";
import { dailyReportSchema, examSchema, goalSchema, profileSchema, studySeriesSchema, studySessionSchema } from "@/lib/validation";
import { buildSubjectStats, gradeDistribution, strengthsAndNeeds } from "@/lib/grades";
import type { User } from "@/lib/types";

let user: User;
let subjectId: string;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T12:00:00Z"));
  setDatabaseForTests(openDatabase(":memory:"));
  user = createUser("09121234567", { name: "ستاره" });
  subjectId = createSubject({ userId: user.id, name: "ریاضی", color: "violet", icon: "calculator" }).id;
});

afterEach(() => {
  closeDatabase();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function report(reportDate: string, minutes = 60): ReportInput {
  return { reportDate, entryIndex: 0, allowAdditional: false, subjects: [{ subjectId, minutes, note: "" }], tasks: [], lessonsReviewed: "", exercises: "", difficulties: "", reflection: "", nextDayGoals: "" };
}

const seriesInput = { subjectId: null, title: "مرور هفتگی", kind: "revision", priority: "medium", notes: "", startDate: "2026-10-17", endDate: "2026-10-30", weekdays: [6], startTime: "17:00", durationMinutes: 60, reminderMinutes: 0 };
const goalInput = { title: "زمان مطالعه", metric: "study-minutes" as const, period: "weekly" as const, targetValue: 60, startDate: "2026-10-01", endDate: null };

describe("nullable form boundaries", () => {
  it("accepts a session and a report task without a subject", () => {
    expect(studySessionSchema.safeParse({ ...seriesInput, subjectId: null, sessionDate: "2026-10-19", endTime: "18:00" }).success).toBe(true);
    expect(dailyReportSchema.safeParse({ ...report("2026-10-19"), subjects: [], tasks: [{ subjectId: null, title: "مرور آزاد", status: "pending" }] }).success).toBe(true);
  });

  it("accepts an explicitly open-ended goal", () => {
    expect(goalSchema.safeParse(goalInput).success).toBe(true);
  });

  it("keeps an empty grade missing and accepts a Persian decimal", () => {
    const exam = { subjectId, title: "آزمون", examDate: "2026-10-19", grade: "   ", maxGrade: 20, weight: "" };
    expect(examSchema.parse(exam).grade).toBeNull();
    expect(examSchema.parse({ ...exam, grade: "۱۷٫۵" }).grade).toBe(17.5);
  });

  it("normalizes Persian and Arabic numeric digits in profile and report inputs", () => {
    const profile = profileSchema.parse({ name: "ستاره", gradeLevel: "۱۰", gradeScale: "٢٠", dailyGoalMinutes: "۱۲۰", reminderLeadMinutes: "٠", notificationEnabled: false });
    expect(profile).toMatchObject({ gradeLevel: 10, gradeScale: 20, dailyGoalMinutes: 120, reminderLeadMinutes: 0 });
    expect(dailyReportSchema.parse({ ...report("2026-10-19"), subjects: [{ subjectId, minutes: "۹۰", note: "" }] }).subjects[0]!.minutes).toBe(90);
  });
});

describe("recurring session integrity", () => {
  it.each([30, 60])("rejects a %i minute session starting at 23:30 without writing a series", durationMinutes => {
    const input = { ...seriesInput, startTime: "23:30", durationMinutes };
    expect(studySeriesSchema.safeParse(input).success).toBe(false);
    expect(() => addSeries(user.id, input)).toThrow();
    expect(getSeriesList(user.id)).toHaveLength(0);
    expect(listSessions(user.id)).toHaveLength(0);
  });

  it.each(["series", "future"] as const)("rolls back every update when a %s edit fails midway", scope => {
    const result = addSeries(user.id, { ...seriesInput, endDate: "2026-11-06" });
    const sessions = listSessions(user.id, { seriesId: result.series.id });
    const selected = sessions[0]!;
    const blockedId = sessions[2]!.id;
    // A SQLite failure after earlier updates must not leave half-edited sessions.
    getDb().exec(`CREATE TRIGGER fail_session_update BEFORE UPDATE ON study_sessions WHEN OLD.id = '${blockedId}' AND NEW.title = 'changed' BEGIN SELECT RAISE(ABORT, 'controlled update failure'); END;`);
    expect(() => updateSession(user.id, { ...seriesInput, id: selected.id, scope, title: "changed", sessionDate: selected.sessionDate, endTime: "18:00" })).toThrow("controlled update failure");
    expect(listSessions(user.id).every(session => session.title === seriesInput.title)).toBe(true);
    expect(getSeriesList(user.id)[0]!.title).toBe(seriesInput.title);
  });
});

describe("goal date and active-count boundaries", () => {
  it("does not count study before a future goal starts", () => {
    saveReport(user.id, report("2026-10-25"));
    const goal = addGoal(user.id, { ...goalInput, startDate: "2026-10-28" });
    const progress = computeGoalProgress(user.id, goal, 20);
    expect(progress.currentValue).toBe(0);
    expect(progress.achieved).toBe(false);
  });

  it("does not substitute another week when a report-card period is disjoint", () => {
    saveReport(user.id, report("2026-10-18"));
    const goal = addGoal(user.id, { ...goalInput, startDate: "2026-10-17" });
    expect(computeGoalProgress(user.id, goal, 20, { start: "2026-10-01", end: "2026-10-10" }).currentValue).toBe(0);
  });

  it.each(["toggle", "edit"] as const)("enforces the 12-active-goal limit through %s", mode => {
    const paused = addGoal(user.id, goalInput);
    toggleGoal(user.id, paused.id, false);
    for (let i = 0; i < 12; i++) addGoal(user.id, { ...goalInput, title: `هدف ${i}` });
    expect(() => mode === "toggle" ? toggleGoal(user.id, paused.id, true) : editGoal(user.id, { ...goalInput, id: paused.id, isActive: true })).toThrow();
    expect(countActiveGoals(user.id)).toBe(12);
  });
});

describe("report card refresh", () => {
  const range = { start: "2026-10-10", end: "2026-10-16" };
  function addExam() {
    return saveExam(user.id, { subjectId, title: "آزمون", examDate: "2026-10-12", grade: 10, maxGrade: 20, weight: null, notes: "" });
  }

  it("refreshes subject labels after a rename even at the same timestamp", () => {
    addExam();
    const card = ensureCard(user, "weekly", range)!;
    updateSubjectRecord({ userId: user.id, id: subjectId, name: "هندسه", color: "teal", icon: "calculator" });
    const refreshed = ensureCard(user, "weekly", range)!;
    expect(refreshed.id).toBe(card.id);
    expect(refreshed.data.subjectStats[0]!.subjectName).toBe("هندسه");
  });

  it("refreshes a direct card read after a grade changes at the same timestamp", () => {
    const exam = addExam();
    const card = ensureCard(user, "weekly", range)!;
    saveExam(user.id, { ...exam, grade: 20, notes: "" });
    expect(getCard(user.id, card.id).data.overallPercent).toBe(100);
  });

  it("removes a stored card when its final source record is deleted", () => {
    addExam();
    const card = ensureCard(user, "weekly", range)!;
    getDb().prepare("DELETE FROM exams WHERE user_id = ?").run(user.id);
    expect(getCards(user).some(item => item.id === card.id)).toBe(false);
    expect(() => getCard(user.id, card.id)).toThrow();
  });

  it("honors an explicit forced rebuild even when the source fingerprint matches", () => {
    addExam();
    const first = ensureCard(user, "weekly", range)!;
    vi.advanceTimersByTime(1000);
    const forced = ensureCard(user, "weekly", range, true)!;
    expect(forced.generatedAt).not.toBe(first.generatedAt);
  });
});

describe("account data integrity and authorization", () => {
  it("rolls back onboarding when default-subject persistence fails", () => {
    getDb().prepare("DELETE FROM subjects WHERE user_id = ?").run(user.id);
    getDb().exec("CREATE TRIGGER fail_subject_insert BEFORE INSERT ON subjects BEGIN SELECT RAISE(ABORT, 'controlled subject failure'); END;");
    expect(() => completeUserOnboarding(user, { name: "ستاره", gradeLevel: 10, field: "math", gradeScale: 20, dailyGoalMinutes: 90 })).toThrow("controlled subject failure");
    expect(findUserById(user.id)!.onboardedAt).toBeNull();
  });

  it("does not leave an incomplete demo account after a seeding failure", () => {
    vi.stubEnv("DEMO_MODE", "true");
    getDb().exec("CREATE TRIGGER fail_demo_exam BEFORE INSERT ON exams BEGIN SELECT RAISE(ABORT, 'controlled demo failure'); END;");
    expect(() => ensureDemoUser()).toThrow("controlled demo failure");
    expect(findUserByPhone("09120000000")).toBeNull();
  });

  it("deletes an account with dependent exams and report subjects, preserving another account", () => {
    const other = createUser("09351234567");
    saveExam(user.id, { subjectId, title: "آزمون", examDate: "2026-10-19", grade: 10, maxGrade: 20, weight: null, notes: "" });
    saveReport(user.id, report("2026-10-19"));
    expect(() => deleteAccount(user.id)).not.toThrow();
    expect(findUserById(user.id)).toBeNull();
    expect(findUserById(other.id)).not.toBeNull();
    expect(getDb().prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("rejects cross-account subject references without creating any records", () => {
    const other = createUser("09351234567");
    expect(() => saveReport(other.id, report("2026-10-19"))).toThrow();
    expect(() => saveExam(other.id, { subjectId, title: "آزمون", examDate: "2026-10-19", grade: 10, maxGrade: 20, weight: null, notes: "" })).toThrow();
    expect(() => addSeries(other.id, { ...seriesInput, subjectId })).toThrow();
  });
});

describe("continuous grade buckets", () => {
  it("counts percentages immediately below every boundary exactly once", () => {
    const buckets = gradeDistribution([49.9999, 69.9999, 84.9999, 100]);
    expect(buckets.map(bucket => bucket.count)).toEqual([1, 1, 1, 1]);
  });

  it("treats an earned zero average as data when identifying subjects needing attention", () => {
    const second = createSubject({ userId: user.id, name: "علوم", color: "teal", icon: "flask" });
    const subjects = [createSubject({ userId: user.id, name: "زبان", color: "sky", icon: "languages" }), second];
    const exams = subjects.map(subject => saveExam(user.id, { subjectId: subject.id, title: "آزمون", examDate: "2026-10-19", grade: 0, maxGrade: 20, weight: null, notes: "" }));
    const stats = buildSubjectStats(subjects, exams, 20);
    expect(strengthsAndNeeds(stats, 0).needs).toHaveLength(2);
  });
});
