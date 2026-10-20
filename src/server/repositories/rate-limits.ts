import { one, run } from "../db/connection";

export type RateLimitRow = {
  key: string;
  window_start: string;
  count: number;
  blocked_until: string | null;
};

export function getRateLimit(key: string): RateLimitRow | null {
  return one<RateLimitRow>("SELECT * FROM rate_limits WHERE key = ?", [key]) ?? null;
}

export function saveRateLimit(row: RateLimitRow): void {
  run(
    `INSERT INTO rate_limits (key, window_start, count, blocked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       window_start = excluded.window_start,
       count = excluded.count,
       blocked_until = excluded.blocked_until`,
    [row.key, row.window_start, row.count, row.blocked_until],
  );
}

export function cleanupRateLimits(beforeIso: string): number {
  return Number(
    run("DELETE FROM rate_limits WHERE window_start < ? AND (blocked_until IS NULL OR blocked_until < ?)", [
      beforeIso,
      beforeIso,
    ]).changes,
  );
}
