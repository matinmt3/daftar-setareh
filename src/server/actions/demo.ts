"use server";

import { redirect } from "next/navigation";
import { actionError } from "../errors";
import { ensureDemoUser, isDemoEnabled } from "../demo";
import { createSessionForUser, setSessionCookie } from "../auth/session";
import { requestContext } from "../request";
import type { SerializedActionResult } from "@/lib/types";

export async function demoLoginAction(): Promise<SerializedActionResult> {
  try {
    if (!isDemoEnabled()) {
      return { ok: false, message: "حساب نمایشی در این نسخه فعال نیست." };
    }
    const user = ensureDemoUser();
    const context = await requestContext();
    const token = await createSessionForUser(user.id, context.userAgent);
    await setSessionCookie(token);
  } catch (error) {
    return actionError(error);
  }
  redirect("/app");
}
