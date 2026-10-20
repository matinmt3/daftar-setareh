"use server";

import { redirect } from "next/navigation";
import { actionError } from "../errors";
import { requestContext } from "../request";
import { requestOtp, verifyOtp } from "../auth/otp";
import {
  logoutCurrentSession,
  setSessionCookie,
} from "../auth/session";
import { requestOtpSchema, otpSchema } from "@/lib/validation";
import { deleteAccount } from "../services/profile";
import { actionUser, parseInput, revalidateApp } from "./helpers";
import type { SerializedActionResult } from "@/lib/types";

export async function requestOtpAction(input: {
  phone: string;
}): Promise<SerializedActionResult<{ devCode?: string; expiresInSeconds: number }>> {
  try {
    const parsed = parseInput(requestOtpSchema, input);
    const context = await requestContext();
    const result = await requestOtp({ phone: parsed.phone, ipHash: context.ipHash });
    return {
      ok: true,
      data: { devCode: result.devCode, expiresInSeconds: result.expiresInSeconds },
      message: result.message,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function verifyOtpAction(input: {
  phone: string;
  code: string;
}): Promise<SerializedActionResult> {
  let destination = "/app";
  try {
    const parsed = parseInput(otpSchema, input);
    const context = await requestContext();
    const result = await verifyOtp({
      phone: parsed.phone,
      code: parsed.code,
      userAgent: context.userAgent,
    });
    await setSessionCookie(result.token);
    destination = result.user.onboardedAt ? "/app" : "/onboarding";
  } catch (error) {
    return actionError(error);
  }
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await logoutCurrentSession();
  revalidateApp();
  redirect("/");
}

export async function deleteAccountAction(input: {
  confirmation: string;
}): Promise<SerializedActionResult> {
  try {
    const user = await actionUser();
    const { accountDeleteSchema } = await import("@/lib/validation");
    parseInput(accountDeleteSchema, input);
    await logoutCurrentSession();
    deleteAccount(user.id);
    revalidateApp();
  } catch (error) {
    return actionError(error);
  }
  redirect("/");
}
