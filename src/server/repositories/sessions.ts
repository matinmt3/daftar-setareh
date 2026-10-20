import { newId, nowIso, one, run } from "../db/connection";
import { mapSession, type SessionRow } from "../db/mappers";
import type { SessionRecord } from "@/lib/types";

export const SESSION_COOKIE = "setareh_session";
export const SESSION_DAYS = 30;

export function createSessionRecord(input: {
  userId: string;
  tokenHash: string;
  userAgent: string | null;
}): SessionRecord {
  const id = newId();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  run(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, created_at, last_used_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.userId, input.tokenHash, input.userAgent, now, now, expiresAt],
  );
  const row = one<SessionRow>("SELECT * FROM sessions WHERE id = ?", [id]);
  if (!row) throw new Error("ساخت نشست انجام نشد.");
  return mapSession(row);
}

export function findSessionByTokenHash(tokenHash: string): SessionRecord | null {
  const row = one<SessionRow>("SELECT * FROM sessions WHERE token_hash = ?", [tokenHash]);
  return row ? mapSession(row) : null;
}

export function touchSession(id: string): void {
  run("UPDATE sessions SET last_used_at = ? WHERE id = ?", [nowIso(), id]);
}

export function deleteSessionByHash(tokenHash: string): void {
  run("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
}

export function deleteUserSessions(userId: string): void {
  run("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

export function cleanupExpiredSessions(): number {
  return Number(
    run("DELETE FROM sessions WHERE expires_at < ?", [nowIso()]).changes,
  );
}
