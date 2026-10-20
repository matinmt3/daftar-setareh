import { NotFoundError } from "../errors";
import {
  createExam,
  deleteExam,
  findExam,
  listExams,
  listRecentExams,
  listUpcomingExams,
  updateExamRecord,
  type ExamFilters,
} from "../repositories/exams";
import { getSubject } from "./subjects";
import type { ExamWithSubject } from "@/lib/types";

export function getExams(userId: string, filters: ExamFilters = {}): ExamWithSubject[] {
  return listExams(userId, filters);
}

export function getRecentExams(userId: string, limit = 5): ExamWithSubject[] {
  return listRecentExams(userId, limit);
}

export function getUpcomingExams(userId: string, fromDate: string, limit = 6): ExamWithSubject[] {
  return listUpcomingExams(userId, fromDate, limit);
}

export function getExam(userId: string, id: string): ExamWithSubject {
  const exam = findExam(userId, id);
  if (!exam) throw new NotFoundError("آزمون پیدا نشد.");
  return exam;
}

function assertSubject(userId: string, subjectId: string): void {
  getSubject(userId, subjectId);
}

export function saveExam(
  userId: string,
  input: {
    id?: string;
    subjectId: string;
    title: string;
    examDate: string;
    grade: number | null;
    maxGrade: number;
    weight: number | null;
    notes: string;
  },
): ExamWithSubject {
  assertSubject(userId, input.subjectId);
  if (input.id) {
    getExam(userId, input.id);
    return updateExamRecord({ userId, id: input.id, ...input });
  }
  return createExam({ userId, ...input });
}

export function removeExam(userId: string, id: string): void {
  getExam(userId, id);
  deleteExam(userId, id);
}
