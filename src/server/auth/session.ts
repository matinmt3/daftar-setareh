import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateSessionToken, hashToken } from "../security";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSessionRecord,
  deleteSessionByHash,
  findSessionByTokenHash,
  touchSession,
} from "../repositories/sessions";
import { findUserById } from "../repositories/users";
import type { User } from "@/lib/types";

const COOKIE_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function createSessionForUser(userId: string, userAgent: string | null): Promise<string> {
  const token = generateSessionToken();
  createSessionRecord({
    userId,
    tokenHash: hashToken(token),
    userAgent,
  });
  return token;
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = findSessionByTokenHash(hashToken(token));
  if (!session) return null;
  if (session.expiresAt <= new Date().toISOString()) {
    deleteSessionByHash(session.tokenHash);
    return null;
  }
  const lastUsed = new Date(session.lastUsedAt).getTime();
  if (Date.now() - lastUsed > 60 * 60 * 1000) {
    touchSession(session.id);
  }
  return findUserById(session.userId);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

export async function requireOnboardedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.onboardedAt || !user.gradeLevel) redirect("/onboarding");
  return user;
}

export async function logoutCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSessionByHash(hashToken(token));
  store.delete(SESSION_COOKIE);
}
