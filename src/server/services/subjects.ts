import { ConflictError, NotFoundError } from "../errors";
import {
  countSubjectExams,
  countSubjectReports,
  createSubject,
  deleteSubjectRecord,
  findSubject,
  findSubjectByName,
  listSubjects,
  setSubjectArchived,
  updateSubjectRecord,
} from "../repositories/subjects";
import { defaultSubjectsFor } from "@/lib/subject-presets";
import { insertSubjects } from "../repositories/subjects";
import type { Subject } from "@/lib/types";

export function getSubjects(userId: string, includeArchived = false): Subject[] {
  return listSubjects(userId, includeArchived);
}

export function getSubject(userId: string, id: string): Subject {
  const subject = findSubject(userId, id);
  if (!subject) throw new NotFoundError("درس پیدا نشد.");
  return subject;
}

export function addSubject(
  userId: string,
  input: { name: string; color: string; icon: string },
): Subject {
  const existing = findSubjectByName(userId, input.name);
  if (existing) {
    if (existing.isArchived) {
      return updateSubjectRecord({
        userId,
        id: existing.id,
        name: input.name,
        color: input.color,
        icon: input.icon,
        isArchived: false,
      });
    }
    throw new ConflictError("درسی با این نام از قبل داری.", {
      name: ["نام این درس تکراری است."],
    });
  }
  return createSubject({ userId, ...input });
}

export function editSubject(
  userId: string,
  input: {
    id: string;
    name: string;
    color: string;
    icon: string;
    isArchived?: boolean;
  },
): Subject {
  const existing = findSubjectByName(userId, input.name);
  if (existing && existing.id !== input.id) {
    throw new ConflictError("درسی با این نام از قبل داری.", {
      name: ["نام این درس تکراری است."],
    });
  }
  getSubject(userId, input.id);
  return updateSubjectRecord({ userId, ...input });
}

export function archiveSubject(userId: string, id: string, archived: boolean): void {
  getSubject(userId, id);
  setSubjectArchived(userId, id, archived);
}

export function removeSubject(userId: string, id: string): void {
  getSubject(userId, id);
  const exams = countSubjectExams(userId, id);
  const reports = countSubjectReports(userId, id);
  if (exams > 0 || reports > 0) {
    throw new ConflictError(
      "این درس در آزمون‌ها یا گزارش‌هایت استفاده شده است. به‌جای حذف، آن را بایگانی کن.",
    );
  }
  deleteSubjectRecord(userId, id);
}

export function seedDefaultSubjects(userId: string, grade: number, field: Parameters<typeof defaultSubjectsFor>[1]): number {
  const existing = listSubjects(userId, true);
  if (existing.length > 0) return 0;
  const presets = defaultSubjectsFor(grade, field);
  insertSubjects(userId, presets);
  return presets.length;
}
