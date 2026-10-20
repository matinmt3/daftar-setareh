"use server";

import { actionError } from "../errors";
import { dailyReportSchema, reportIdSchema } from "@/lib/validation";
import { removeReport, saveReport } from "../services/reports";
import { actionOnboardedUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function saveReportAction(input: {
  id?: string;
  reportDate: string;
  entryIndex?: string | number;
  allowAdditional?: boolean;
  subjects: { subjectId: string; minutes: string | number; note?: string }[];
  tasks: { subjectId?: string | null; title: string; status: "completed" | "pending" }[];
  lessonsReviewed?: string;
  exercises?: string;
  difficulties?: string;
  reflection?: string;
  nextDayGoals?: string;
}): Promise<SerializedActionResult<{ id: string }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(dailyReportSchema, input);
    const report = saveReport(user.id, {
      id: parsed.id,
      reportDate: parsed.reportDate,
      entryIndex: parsed.entryIndex,
      allowAdditional: parsed.allowAdditional,
      subjects: parsed.subjects,
      tasks: parsed.tasks,
      lessonsReviewed: parsed.lessonsReviewed,
      exercises: parsed.exercises,
      difficulties: parsed.difficulties,
      reflection: parsed.reflection,
      nextDayGoals: parsed.nextDayGoals,
    });
    revalidateApp();
    return {
      ok: true,
      data: { id: report.id },
      message: parsed.id ? "گزارش ویرایش شد." : "گزارش روزانه ثبت شد.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteReportAction(input: {
  id: string;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(reportIdSchema, input);
    removeReport(user.id, parsed.id);
    revalidateApp();
    return { ok: true, message: "گزارش حذف شد." };
  } catch (error) {
    return actionError(error);
  }
}
