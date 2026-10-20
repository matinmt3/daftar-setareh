"use server";

import { z } from "zod";
import { actionError } from "../errors";
import {
  sessionScopeSchema,
  studySeriesSchema,
  studySessionSchema,
  studySessionUpdateSchema,
} from "@/lib/validation";
import {
  addSeries,
  addSession,
  getSession,
  removeSession,
  toggleSession,
  updateSession,
} from "../services/planner";
import { actionOnboardedUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function createSessionAction(input: {
  subjectId?: string | null;
  title: string;
  kind: string;
  priority: string;
  notes?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  reminderMinutes?: string | number;
}): Promise<SerializedActionResult<{ id: string }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(studySessionSchema, input);
    const session = addSession(user.id, parsed);
    revalidateApp();
    return { ok: true, data: { id: session.id }, message: "جلسه به برنامه اضافه شد." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createSeriesAction(input: {
  subjectId?: string | null;
  title: string;
  kind: string;
  priority: string;
  notes?: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: string | number;
  reminderMinutes?: string | number;
}): Promise<SerializedActionResult<{ id: string; created: number }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(studySeriesSchema, input);
    const result = addSeries(user.id, parsed);
    revalidateApp();
    return {
      ok: true,
      data: { id: result.series.id, created: result.created },
      message: `${result.created} جلسه ساخته شد.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSessionAction(input: {
  id: string;
  scope: "single" | "future" | "series";
  subjectId?: string | null;
  title: string;
  kind: string;
  priority: string;
  notes?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  reminderMinutes?: string | number;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(studySessionUpdateSchema, input);
    updateSession(user.id, parsed);
    revalidateApp();
    return { ok: true, message: "جلسه ویرایش شد." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleSessionAction(input: {
  id: string;
  completed: boolean;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(
      z.object({ id: z.string().min(1), completed: z.boolean() }),
      input,
    );
    getSession(user.id, parsed.id);
    toggleSession(user.id, parsed.id, parsed.completed);
    revalidateApp();
    return {
      ok: true,
      message: parsed.completed ? "جلسه انجام‌شده شد." : "جلسه به حالت برنامه‌ریزی‌شده برگشت.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteSessionAction(input: {
  id: string;
  scope: "single" | "future" | "series";
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(
      z.object({ id: z.string().min(1), scope: sessionScopeSchema }),
      input,
    );
    removeSession(user.id, parsed.id, parsed.scope);
    revalidateApp();
    return { ok: true, message: "جلسه حذف شد." };
  } catch (error) {
    return actionError(error);
  }
}
