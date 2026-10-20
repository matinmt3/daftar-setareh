import { all, newId, nowIso, one, run } from "../db/connection";
import { mapUser, type UserRow } from "../db/mappers";
import type { StudyFieldValue } from "@/lib/constants";
import type { User } from "@/lib/types";

export function findUserById(id: string): User | null {
  const row = one<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
  return row ? mapUser(row) : null;
}

export function findUserByPhone(phone: string): User | null {
  const row = one<UserRow>("SELECT * FROM users WHERE phone = ?", [phone]);
  return row ? mapUser(row) : null;
}

export function createUser(phone: string, options?: { name?: string | null; isDemo?: boolean }): User {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO users (id, phone, name, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, phone, options?.name ?? null, options?.isDemo ? 1 : 0, now, now],
  );
  const user = findUserById(id);
  if (!user) throw new Error("ساخت حساب کاربری انجام نشد.");
  return user;
}

export function updateProfile(
  userId: string,
  input: {
    name: string;
    gradeLevel: number;
    field: StudyFieldValue | null;
    gradeScale: number;
    dailyGoalMinutes: number;
    notificationEnabled: boolean;
    reminderLeadMinutes: number;
  },
): User {
  const now = nowIso();
  run(
    `UPDATE users
     SET name = ?, grade_level = ?, field = ?, grade_scale = ?, daily_goal_minutes = ?,
         notification_enabled = ?, reminder_lead_minutes = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name,
      input.gradeLevel,
      input.field,
      input.gradeScale,
      input.dailyGoalMinutes,
      input.notificationEnabled ? 1 : 0,
      input.reminderLeadMinutes,
      now,
      userId,
    ],
  );
  const user = findUserById(userId);
  if (!user) throw new Error("حساب کاربری پیدا نشد.");
  return user;
}

export function completeOnboarding(
  userId: string,
  input: {
    name: string;
    gradeLevel: number;
    field: StudyFieldValue | null;
    gradeScale: number;
    dailyGoalMinutes: number;
  },
): User {
  const now = nowIso();
  run(
    `UPDATE users
     SET name = ?, grade_level = ?, field = ?, grade_scale = ?, daily_goal_minutes = ?,
         onboarded_at = COALESCE(onboarded_at, ?), updated_at = ?
     WHERE id = ?`,
    [
      input.name,
      input.gradeLevel,
      input.field,
      input.gradeScale,
      input.dailyGoalMinutes,
      now,
      now,
      userId,
    ],
  );
  const user = findUserById(userId);
  if (!user) throw new Error("حساب کاربری پیدا نشد.");
  return user;
}

export function setGradeScale(userId: string, scale: number): void {
  run("UPDATE users SET grade_scale = ?, updated_at = ? WHERE id = ?", [scale, nowIso(), userId]);
}

export function deleteUser(userId: string): void {
  run("DELETE FROM users WHERE id = ?", [userId]);
}

export function listUsersForCron(): User[] {
  const rows = all<UserRow>(
    "SELECT * FROM users WHERE onboarded_at IS NOT NULL ORDER BY created_at ASC",
  );
  return rows.map(mapUser);
}

export function listUsers(): User[] {
  return all<UserRow>("SELECT * FROM users ORDER BY created_at ASC").map(mapUser);
}

export function countUsers(): number {
  const row = one<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  return row?.count ?? 0;
}

export function updateUserPreferences(
  userId: string,
  input: { notificationEnabled: boolean; reminderLeadMinutes: number },
): void {
  run(
    "UPDATE users SET notification_enabled = ?, reminder_lead_minutes = ?, updated_at = ? WHERE id = ?",
    [input.notificationEnabled ? 1 : 0, input.reminderLeadMinutes, nowIso(), userId],
  );
}
