import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { AppError, UnauthorizedError } from "../errors";
import { getCurrentUser } from "../auth/session";
import { fieldErrorsFromZod } from "@/lib/validation";
import type { User } from "@/lib/types";

export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors = fieldErrorsFromZod(result.error);
    const message = result.error.issues[0]?.message ?? "اطلاعات واردشده معتبر نیست.";
    throw new AppError(message, { code: "validation", fieldErrors });
  }
  return result.data;
}

export async function actionUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function actionOnboardedUser(): Promise<User> {
  const user = await actionUser();
  if (!user.onboardedAt || !user.gradeLevel) {
    throw new AppError("اول اطلاعات تحصیلی‌ات را کامل کن.", { code: "onboarding_required" });
  }
  return user;
}

export function revalidateApp(): void {
  [
    "/app",
    "/app/reports",
    "/app/exams",
    "/app/cards",
    "/app/planner",
    "/app/analytics",
    "/app/settings",
  ].forEach((path) => revalidatePath(path));
}
