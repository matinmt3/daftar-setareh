"use server";

import { redirect } from "next/navigation";
import { actionError } from "../errors";
import { onboardingSchema, profileSchema } from "@/lib/validation";
import { completeUserOnboarding, updateUserProfile } from "../services/profile";
import { actionUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function completeOnboardingAction(input: {
  name: string;
  gradeLevel: string | number;
  field?: string | null;
  dailyGoalMinutes: string | number;
  gradeScale: string | number;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionUser();
    const parsed = parseInput(onboardingSchema, input);
    completeUserOnboarding(user, parsed);
    revalidateApp();
  } catch (error) {
    return actionError(error);
  }
  redirect("/app");
}

export async function updateProfileAction(input: {
  name: string;
  gradeLevel: string | number;
  field?: string | null;
  gradeScale: string | number;
  dailyGoalMinutes: string | number;
  notificationEnabled: boolean;
  reminderLeadMinutes: string | number;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionUser();
    const parsed = parseInput(profileSchema, input);
    updateUserProfile(user, parsed);
    revalidateApp();
    return { ok: true, message: "تنظیمات ذخیره شد." };
  } catch (error) {
    return actionError(error);
  }
}
