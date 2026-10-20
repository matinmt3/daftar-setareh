import { transaction } from "../db/connection";
import { AppError, NotFoundError } from "../errors";
import { durationBetween, minutesToTime, timeToMinutes, diffDaysISO, addDaysISO } from "@/lib/dates";
import { generateRecurrenceDates, MAX_RECURRENCE_DAYS, MAX_RECURRENCE_OCCURRENCES } from "@/lib/recurrence";
import {
  createSeriesRecord,
  createSessionRecord,
  deleteFutureSeriesSessions,
  deleteSeriesRecord,
  deleteSessionRecord,
  findSeries,
  findSession,
  listSessions,
  listSeries,
  updateSeriesRecord,
  updateSessionMeta,
  updateSessionRecord,
  updateSessionStatus,
  type SessionFilters,
} from "../repositories/planner";
import { getSubject } from "./subjects";
import type { StudySeries, StudySession } from "@/lib/types";

export type SessionInput = {
  subjectId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  reminderMinutes: number;
};

export type SeriesInput = {
  subjectId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  reminderMinutes: number;
};

function assertSubject(userId: string, subjectId: string | null): void {
  if (subjectId) getSubject(userId, subjectId);
}

export function getSessions(userId: string, filters: SessionFilters = {}): StudySession[] {
  return listSessions(userId, filters);
}

export function getSession(userId: string, id: string): StudySession {
  const session = findSession(userId, id);
  if (!session) throw new NotFoundError("جلسهٔ مطالعه پیدا نشد.");
  return session;
}

export function addSession(userId: string, input: SessionInput): StudySession {
  assertSubject(userId, input.subjectId);
  const duration = durationBetween(input.startTime, input.endTime);
  if (duration <= 0) {
    throw new AppError("مدت جلسه باید بیشتر از صفر باشد.", {
      fieldErrors: { endTime: ["ساعت پایان باید بعد از شروع باشد."] },
    });
  }
  return createSessionRecord({
    userId,
    ...input,
    seriesId: null,
    durationMinutes: duration,
  });
}

export function addSeries(userId: string, input: SeriesInput): { series: StudySeries; created: number } {
  assertSubject(userId, input.subjectId);
  const span = diffDaysISO(input.startDate, input.endDate);
  if (span < 0) {
    throw new AppError("تاریخ پایان باید بعد از تاریخ شروع باشد.", {
      fieldErrors: { endDate: ["تاریخ پایان نامعتبر است."] },
    });
  }
  if (span > MAX_RECURRENCE_DAYS) {
    throw new AppError(`بازهٔ تکرار نباید بیشتر از ${MAX_RECURRENCE_DAYS} روز باشد.`, {
      fieldErrors: { endDate: ["بازهٔ تکرار بیش از حد طولانی است."] },
    });
  }
  const dates = generateRecurrenceDates({
    startDate: input.startDate,
    endDate: input.endDate,
    weekdays: input.weekdays,
  });
  if (dates.length === 0) {
    throw new AppError("با این روزهای هفته، جلسه‌ای در بازهٔ انتخابی ساخته نمی‌شود.", {
      fieldErrors: { weekdays: ["دست‌کم یک روز مناسب در بازه انتخاب کن."] },
    });
  }
  if (dates.length > MAX_RECURRENCE_OCCURRENCES) {
    throw new AppError("تعداد جلسات این برنامه بیش از حد زیاد است. بازه یا روزها را کمتر کن.", {
      fieldErrors: { weekdays: ["تعداد جلسات بیش از حد است."] },
    });
  }
  const endMinutes = timeToMinutes(input.startTime) + input.durationMinutes;
  if (endMinutes >= 1440) {
    throw new AppError("جلسه باید پیش از پایان همان روز تمام شود.", {
      fieldErrors: { durationMinutes: ["ساعت شروع یا مدت جلسه را تغییر بده."] },
    });
  }
  const endTime = minutesToTime(endMinutes);

  return transaction(() => {
    const series = createSeriesRecord({ userId, ...input });
    dates.forEach((date) => {
      createSessionRecord({
        userId,
        subjectId: input.subjectId,
        seriesId: series.id,
        title: input.title,
        kind: input.kind,
        priority: input.priority,
        notes: input.notes,
        sessionDate: date,
        startTime: input.startTime,
        endTime,
        durationMinutes: input.durationMinutes,
        reminderMinutes: input.reminderMinutes,
      });
    });
    return { series, created: dates.length };
  });
}

export function getSeries(userId: string, id: string): StudySeries {
  const series = findSeries(userId, id);
  if (!series) throw new NotFoundError("برنامهٔ تکرارشونده پیدا نشد.");
  return series;
}

export function getSeriesList(userId: string, fromDate?: string): StudySeries[] {
  return listSeries(userId, fromDate);
}

export function updateSession(
  userId: string,
  input: SessionInput & { id: string; scope: "single" | "future" | "series" },
): StudySession {
  assertSubject(userId, input.subjectId);
  const session = getSession(userId, input.id);
  const duration = durationBetween(input.startTime, input.endTime);
  if (duration <= 0) {
    throw new AppError("مدت جلسه باید بیشتر از صفر باشد.", {
      fieldErrors: { endTime: ["ساعت پایان باید بعد از شروع باشد."] },
    });
  }
  const meta = {
    subjectId: input.subjectId,
    title: input.title,
    kind: input.kind,
    priority: input.priority,
    notes: input.notes,
    startTime: input.startTime,
    endTime: input.endTime,
    durationMinutes: duration,
    reminderMinutes: input.reminderMinutes,
  };

  return transaction(() => {
    if (input.scope === "series" && session.seriesId) {
      const series = getSeries(userId, session.seriesId);
      updateSeriesRecord({
        userId,
        id: series.id,
        subjectId: input.subjectId,
        title: input.title,
        kind: input.kind,
        priority: input.priority,
        notes: input.notes,
        startDate: series.startDate,
        endDate: series.endDate,
        weekdays: series.weekdays,
        startTime: input.startTime,
        durationMinutes: duration,
        reminderMinutes: input.reminderMinutes,
      });
      const sessions = listSessions(userId, { seriesId: series.id, status: "planned" });
      sessions.forEach((item) => {
        if (item.id === session.id) return;
        updateSessionMeta(userId, item.id, meta);
      });
      updateSessionRecord({
        userId,
        id: session.id,
        ...meta,
        sessionDate: input.sessionDate,
        seriesId: series.id,
      });
      return getSession(userId, session.id);
    }

    if (input.scope === "future" && session.seriesId) {
      const future = listSessions(userId, {
        seriesId: session.seriesId,
        status: "planned",
        from: session.sessionDate,
      });
      const dateDelta = diffDaysISO(session.sessionDate, input.sessionDate);
      future.forEach((item) => {
        if (item.id === session.id) return;
        updateSessionMeta(userId, item.id, meta);
        if (dateDelta !== 0) {
          const shifted = addDaysISO(item.sessionDate, dateDelta);
          updateSessionRecord({
            userId,
            id: item.id,
            ...meta,
            sessionDate: shifted,
          });
        }
      });
      updateSessionRecord({
        userId,
        id: session.id,
        ...meta,
        sessionDate: input.sessionDate,
        seriesId: session.seriesId,
      });
      return getSession(userId, session.id);
    }

    updateSessionRecord({
      userId,
      id: session.id,
      ...meta,
      sessionDate: input.sessionDate,
      seriesId: session.seriesId ? null : undefined,
    });
    return getSession(userId, session.id);
  });
}

export function toggleSession(userId: string, id: string, completed: boolean): StudySession {
  getSession(userId, id);
  updateSessionStatus(userId, id, completed ? "completed" : "planned");
  return getSession(userId, id);
}

export function removeSession(userId: string, id: string, scope: "single" | "future" | "series"): void {
  const session = getSession(userId, id);
  if (!session.seriesId || scope === "single") {
    deleteSessionRecord(userId, id);
    return;
  }
  if (scope === "future") {
    deleteFutureSeriesSessions(userId, session.seriesId, session.sessionDate);
    return;
  }
  deleteSeriesRecord(userId, session.seriesId);
}

export function removeSeries(userId: string, seriesId: string): void {
  getSeries(userId, seriesId);
  deleteSeriesRecord(userId, seriesId);
}
