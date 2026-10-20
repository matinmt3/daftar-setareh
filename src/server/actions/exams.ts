"use server";

import { actionError } from "../errors";
import { examSchema, examIdSchema } from "@/lib/validation";
import { removeExam, saveExam } from "../services/exams";
import { actionOnboardedUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function saveExamAction(input: {
  id?: string;
  subjectId: string;
  title: string;
  examDate: string;
  grade: string | number | null;
  maxGrade: string | number;
  weight: string | number | null;
  notes?: string;
}): Promise<SerializedActionResult<{ id: string }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(examSchema, input);
    const exam = saveExam(user.id, {
      id: parsed.id,
      subjectId: parsed.subjectId,
      title: parsed.title,
      examDate: parsed.examDate,
      grade: parsed.grade,
      maxGrade: parsed.maxGrade,
      weight: parsed.weight,
      notes: parsed.notes,
    });
    revalidateApp();
    return {
      ok: true,
      data: { id: exam.id },
      message: parsed.id ? "آزمون ویرایش شد." : "آزمون ثبت شد.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteExamAction(input: {
  id: string;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(examIdSchema, input);
    removeExam(user.id, parsed.id);
    revalidateApp();
    return { ok: true, message: "آزمون حذف شد." };
  } catch (error) {
    return actionError(error);
  }
}
