import { getRateLimit, saveRateLimit } from "./repositories/rate-limits";
import { AppError, formatRetry } from "./errors";

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowSeconds: number; blockSeconds?: number },
): void {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const blockMs = (options.blockSeconds ?? options.windowSeconds) * 1000;
  const row = getRateLimit(key);
  let windowStart = now;
  let count = 0;
  let blockedUntil: string | null = null;

  if (row) {
    const blockedTime = row.blocked_until ? new Date(row.blocked_until).getTime() : 0;
    if (blockedTime > now) {
      throw new AppError(
        `تعداد تلاش‌ها زیاد شده است. لطفاً بعد از ${formatRetry((blockedTime - now) / 1000)} دوباره تلاش کن.`,
        { code: "rate_limited", retryAfterSeconds: Math.ceil((blockedTime - now) / 1000) },
      );
    }
    const startTime = new Date(row.window_start).getTime();
    if (Number.isFinite(startTime) && now - startTime < windowMs) {
      windowStart = startTime;
      count = row.count;
    }
  }

  if (count >= options.limit) {
    const blocked = new Date(now + blockMs).toISOString();
    saveRateLimit({
      key,
      window_start: new Date(windowStart).toISOString(),
      count,
      blocked_until: blocked,
    });
    throw new AppError(
      `تعداد تلاش‌ها زیاد شده است. لطفاً بعد از ${formatRetry(blockMs / 1000)} دوباره تلاش کن.`,
      { code: "rate_limited", retryAfterSeconds: Math.ceil(blockMs / 1000) },
    );
  }

  saveRateLimit({
    key,
    window_start: new Date(windowStart).toISOString(),
    count: count + 1,
    blocked_until: blockedUntil,
  });
}

export function minutesUntilAllowed(key: string): number {
  const row = getRateLimit(key);
  if (!row?.blocked_until) return 0;
  return Math.max(0, Math.ceil((new Date(row.blocked_until).getTime() - Date.now()) / 60000));
}
