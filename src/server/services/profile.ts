import type { z } from "zod";
import { UnauthorizedError } from "../errors";
import { transaction } from "../db/connection";
import { completeOnboarding, deleteUser, findUserById, updateProfile } from "../repositories/users";
import { deleteUserSessions } from "../repositories/sessions";
import { seedDefaultSubjects } from "./subjects";
import type { StudyFieldValue } from "@/lib/constants";
import type { User } from "@/lib/types";
import type { onboardingSchema, profileSchema } from "@/lib/validation";

export function completeUserOnboarding(
  user: User,
  input: z.infer<typeof onboardingSchema>,
): User {
  return transaction(() => {
    const updated = completeOnboarding(user.id, {
      name: input.name,
      gradeLevel: input.gradeLevel,
      field: (input.field as StudyFieldValue | null | undefined) ?? null,
      gradeScale: input.gradeScale,
      dailyGoalMinutes: input.dailyGoalMinutes,
    });
    seedDefaultSubjects(user.id, updated.gradeLevel ?? 1, updated.field);
    return updated;
  });
}

export function updateUserProfile(
  user: User,
  input: z.infer<typeof profileSchema>,
): User {
  return updateProfile(user.id, {
    name: input.name,
    gradeLevel: input.gradeLevel,
    field: (input.field as StudyFieldValue | null | undefined) ?? null,
    gradeScale: input.gradeScale,
    dailyGoalMinutes: input.dailyGoalMinutes,
    notificationEnabled: input.notificationEnabled,
    reminderLeadMinutes: input.reminderLeadMinutes,
  });
}

export function deleteAccount(userId: string): void {
  if (!findUserById(userId)) throw new UnauthorizedError();
  deleteUserSessions(userId);
  deleteUser(userId);
}

export function requireActiveUser(user: User | null): User {
  if (!user) throw new UnauthorizedError();
  return user;
}
