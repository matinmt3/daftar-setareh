import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 24) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET باید در محیط تولید تنظیم شود و دست‌کم ۲۴ نویسه باشد.");
  }
  return "daftar-setareh-development-secret-only";
}

export function hmac(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

export function hashOtp(challengeId: string, phone: string, code: string): string {
  return hmac(`otp:${challengeId}:${phone}:${code}`);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  if (first.length !== second.length) return false;
  return timingSafeEqual(first, second);
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashIp(ip: string): string {
  return hashToken(`${ip}:${getAuthSecret()}`);
}
