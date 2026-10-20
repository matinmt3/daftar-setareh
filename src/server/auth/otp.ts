import { addMinutes } from "date-fns";
import { AppError } from "../errors";
import { consumeRateLimit } from "../rate-limit";
import { isDeveloperOtpVisible, sendOtpSms } from "../sms";
import { generateOtp, generateSessionToken, hashOtp, hashToken, safeEqual } from "../security";
import { newId, transaction } from "../db/connection";
import {
  consumeOtp,
  countOtpsForIpSince,
  countOtpsSince,
  createOtp,
  findLatestActiveOtp,
  incrementOtpAttempts,
  invalidateActiveOtps,
} from "../repositories/otp";
import { createSessionRecord } from "../repositories/sessions";
import { createUser, findUserByPhone } from "../repositories/users";
import type { User } from "@/lib/types";

export const OTP_TTL_MINUTES = 2;
export const OTP_MAX_ATTEMPTS = 5;

export type RequestOtpResult = {
  devCode?: string;
  expiresInSeconds: number;
  message: string;
};

export async function requestOtp(input: {
  phone: string;
  ipHash: string | null;
}): Promise<RequestOtpResult> {
  const { phone, ipHash } = input;
  consumeRateLimit(`otp:cooldown:${phone}`, { limit: 1, windowSeconds: 60, blockSeconds: 45 });
  consumeRateLimit(`otp:hour:${phone}`, { limit: 5, windowSeconds: 3600, blockSeconds: 900 });
  if (ipHash) {
    consumeRateLimit(`otp:ip:${ipHash}`, { limit: 25, windowSeconds: 3600, blockSeconds: 900 });
    const ipCount = countOtpsForIpSince(ipHash, new Date(Date.now() - 3600_000).toISOString());
    if (ipCount >= 25) {
      throw new AppError("تعداد درخواست‌های کد تأیید از این دستگاه زیاد بوده است. کمی بعد تلاش کن.", {
        code: "rate_limited",
      });
    }
  }
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  if (countOtpsSince(phone, hourAgo) >= 5) {
    throw new AppError("برای این شماره در یک ساعت گذشته کد زیادی ارسال شده است. کمی بعد تلاش کن.", {
      code: "rate_limited",
    });
  }

  const code = generateOtp();
  const challengeId = newId();
  invalidateActiveOtps(phone);
  const challenge = createOtp({
    id: challengeId,
    phone,
    codeHash: hashOtp(challengeId, phone, code),
    expiresAt: addMinutes(new Date(), OTP_TTL_MINUTES).toISOString(),
    ipHash,
  });
  try {
    await sendOtpSms(phone, code);
  } catch (error) {
    consumeOtp(challenge.id);
    throw error;
  }

  return {
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    message: "کد تأیید ارسال شد.",
    devCode: isDeveloperOtpVisible() ? code : undefined,
  };
}

export type VerifyOtpResult = {
  user: User;
  token: string;
  isNewUser: boolean;
};

export async function verifyOtp(input: {
  phone: string;
  code: string;
  userAgent: string | null;
}): Promise<VerifyOtpResult> {
  consumeRateLimit(`otp:verify:${input.phone}`, {
    limit: 12,
    windowSeconds: 900,
    blockSeconds: 900,
  });
  const challenge = findLatestActiveOtp(input.phone);
  if (!challenge) {
    throw new AppError("کد تأیید فعالی برای این شماره پیدا نشد. دوباره کد بگیر.", {
      code: "otp_missing",
    });
  }
  if (challenge.expires_at <= new Date().toISOString()) {
    consumeOtp(challenge.id);
    throw new AppError("کد تأیید منقضی شده است. دوباره کد بگیر.", { code: "otp_expired" });
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    consumeOtp(challenge.id);
    throw new AppError("تعداد تلاش برای این کد تمام شده است. دوباره کد بگیر.", {
      code: "otp_attempts",
    });
  }
  const expected = hashOtp(challenge.id, input.phone, input.code);
  if (!safeEqual(expected, challenge.code_hash)) {
    incrementOtpAttempts(challenge.id);
    const remaining = OTP_MAX_ATTEMPTS - challenge.attempts - 1;
    if (remaining <= 0) consumeOtp(challenge.id);
    throw new AppError(
      remaining > 0
        ? `کد تأیید درست نیست. ${remaining} تلاش دیگر مانده است.`
        : "کد تأیید باطل شد. دوباره کد بگیر.",
      { code: "otp_invalid" },
    );
  }

  return transaction(() => {
    // Claim the code under the same write lock as account and session creation.
    // A failure must leave the verified challenge available for a retry.
    const active = findLatestActiveOtp(input.phone);
    if (!active || active.id !== challenge.id || active.attempts >= OTP_MAX_ATTEMPTS || active.expires_at <= new Date().toISOString()) {
      throw new AppError("کد تأیید دیگر فعال نیست. دوباره کد بگیر.", { code: "otp_missing" });
    }
    consumeOtp(challenge.id);
    const existing = findUserByPhone(input.phone);
    const user = existing ?? createUser(input.phone);
    const token = generateSessionToken();
    createSessionRecord({
      userId: user.id,
      tokenHash: hashToken(token),
      userAgent: input.userAgent,
    });
    return { user, token, isNewUser: !existing };
  });
}
