"use server";

import { actionError } from "../errors";
import { subjectSchema, subjectUpdateSchema } from "@/lib/validation";
import {
  addSubject,
  archiveSubject,
  editSubject,
  removeSubject,
} from "../services/subjects";
import { actionOnboardedUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function createSubjectAction(input: {
  name: string;
  color: string;
  icon: string;
}): Promise<SerializedActionResult<{ id: string }>> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(subjectSchema, input);
    const subject = addSubject(user.id, parsed);
    revalidateApp();
    return { ok: true, data: { id: subject.id }, message: "درس اضافه شد." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSubjectAction(input: {
  id: string;
  name: string;
  color: string;
  icon: string;
  isArchived?: boolean;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const parsed = parseInput(subjectUpdateSchema, input);
    editSubject(user.id, parsed);
    revalidateApp();
    return { ok: true, message: "درس ویرایش شد." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleSubjectArchiveAction(input: {
  id: string;
  archived: boolean;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const { z } = await import("zod");
    const parsed = parseInput(
      z.object({ id: z.string().min(1), archived: z.boolean() }),
      input,
    );
    archiveSubject(user.id, parsed.id, parsed.archived);
    revalidateApp();
    return {
      ok: true,
      message: parsed.archived ? "درس بایگانی شد." : "درس به فهرست فعال برگشت.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteSubjectAction(input: {
  id: string;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionOnboardedUser();
    const { z } = await import("zod");
    const parsed = parseInput(z.object({ id: z.string().min(1) }), input);
    removeSubject(user.id, parsed.id);
    revalidateApp();
    return { ok: true, message: "درس حذف شد." };
  } catch (error) {
    return actionError(error);
  }
}
