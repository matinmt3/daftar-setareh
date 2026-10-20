"use server";

import { z } from "zod";
import { actionError } from "../errors";
import { goalSchema } from "@/lib/validation";
import {
  addGoal,
  editGoal,
  removeGoal,
  toggleGoal,
} from "../services/goals";
import { actionOnboardedUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function saveGoalAction(input: {
  id?: string;
  title: string;
  metric: string;
  period: string;
  targetValue: string | number;
  startDate: string;
  endDate?: string | null;
}): Promise<SerializedActionResult<{ id: string }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(goalSchema, input);
    const goal = parsed.id
      ? editGoal(user.id, {
          id: parsed.id,
          title: parsed.title,
          metric: parsed.metric,
          period: parsed.period,
          targetValue: parsed.targetValue,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
        })
      : addGoal(user.id, {
          title: parsed.title,
          metric: parsed.metric,
          period: parsed.period,
          targetValue: parsed.targetValue,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
        });
    revalidateApp();
    return {
      ok: true,
      data: { id: goal.id },
      message: parsed.id ? "هدف ویرایش شد." : "هدف اضافه شد.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleGoalAction(input: {
  id: string;
  active: boolean;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(
      z.object({ id: z.string().min(1), active: z.boolean() }),
      input,
    );
    toggleGoal(user.id, parsed.id, parsed.active);
    revalidateApp();
    return {
      ok: true,
      message: parsed.active ? "هدف فعال شد." : "هدف غیرفعال شد.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteGoalAction(input: {
  id: string;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(z.object({ id: z.string().min(1) }), input);
    removeGoal(user.id, parsed.id);
    revalidateApp();
    return { ok: true, message: "هدف حذف شد." };
  } catch (error) {
    return actionError(error);
  }
}
