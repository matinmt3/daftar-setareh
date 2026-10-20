import { all, newId, nowIso, one, run } from "../db/connection";

export type OtpRow = {
  id: string;
  phone: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
  ip_hash: string | null;
};

export function createOtp(input: {
  id?: string;
  phone: string;
  codeHash: string;
  expiresAt: string;
  ipHash: string | null;
}): OtpRow {
  const id = input.id ?? newId();
  run(
    `INSERT INTO otp_challenges (id, phone, code_hash, expires_at, created_at, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.phone, input.codeHash, input.expiresAt, nowIso(), input.ipHash],
  );
  const row = one<OtpRow>("SELECT * FROM otp_challenges WHERE id = ?", [id]);
  if (!row) throw new Error("ثبت کد تأیید انجام نشد.");
  return row;
}

export function findLatestActiveOtp(phone: string): OtpRow | null {
  const row = one<OtpRow>(
    `SELECT * FROM otp_challenges
     WHERE phone = ? AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  return row ?? null;
}

export function countOtpsSince(phone: string, sinceIso: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM otp_challenges WHERE phone = ? AND created_at >= ?",
    [phone, sinceIso],
  );
  return row?.count ?? 0;
}

export function countOtpsForIpSince(ipHash: string, sinceIso: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM otp_challenges WHERE ip_hash = ? AND created_at >= ?",
    [ipHash, sinceIso],
  );
  return row?.count ?? 0;
}

export function latestOtpCreatedAt(phone: string): string | null {
  const row = one<{ created_at: string }>(
    "SELECT created_at FROM otp_challenges WHERE phone = ? ORDER BY created_at DESC LIMIT 1",
    [phone],
  );
  return row?.created_at ?? null;
}

export function incrementOtpAttempts(id: string): void {
  run("UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?", [id]);
}

export function consumeOtp(id: string): void {
  run("UPDATE otp_challenges SET consumed_at = ? WHERE id = ?", [nowIso(), id]);
}

export function invalidateActiveOtps(phone: string): void {
  run("UPDATE otp_challenges SET consumed_at = ? WHERE phone = ? AND consumed_at IS NULL", [
    nowIso(),
    phone,
  ]);
}

export function cleanupOldOtps(beforeIso: string): number {
  return Number(
    run("DELETE FROM otp_challenges WHERE created_at < ?", [beforeIso]).changes,
  );
}

export function listActiveOtps(phone: string): OtpRow[] {
  return all<OtpRow>(
    "SELECT * FROM otp_challenges WHERE phone = ? AND consumed_at IS NULL ORDER BY created_at DESC",
    [phone],
  );
}
