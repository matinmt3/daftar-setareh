import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeDatabase, getDb, openDatabase, setDatabaseForTests } from "@/server/db/connection";
import { consumeRateLimit } from "@/server/rate-limit";
import { verifyOtp } from "@/server/auth/otp";
import { createOtp, findLatestActiveOtp } from "@/server/repositories/otp";
import { hashOtp } from "@/server/security";
import { sendOtpSms } from "@/server/sms";

const phone = "09121234567";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T12:00:00Z"));
  vi.stubEnv("AUTH_SECRET", "isolated-test-secret-no-real-credentials");
  setDatabaseForTests(openDatabase(":memory:"));
});

afterEach(() => {
  closeDatabase();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function challenge(expiresAt = "2026-10-19T12:02:00.000Z") {
  return createOtp({ id: "test-challenge", phone, codeHash: hashOtp("test-challenge", phone, "123456"), expiresAt, ipHash: null });
}

describe("OTP verification integrity", () => {
  it("creates one session and rejects replay of a consumed code", async () => {
    challenge();
    await verifyOtp({ phone, code: "123456", userAgent: null });
    await expect(verifyOtp({ phone, code: "123456", userAgent: null })).rejects.toThrow();
    expect(getDb().prepare("SELECT COUNT(*) AS count FROM sessions").get()).toMatchObject({ count: 1 });
  });

  it("persists failed attempts and invalidates the code after five failures", async () => {
    challenge();
    for (let i = 0; i < 5; i++) await expect(verifyOtp({ phone, code: "000000", userAgent: null })).rejects.toThrow();
    expect(findLatestActiveOtp(phone)).toBeNull();
    await expect(verifyOtp({ phone, code: "123456", userAgent: null })).rejects.toThrow();
    expect(getDb().prepare("SELECT COUNT(*) AS count FROM users").get()).toMatchObject({ count: 0 });
  });

  it("rejects an expired code", async () => {
    challenge("2026-10-19T12:00:00.000Z");
    await expect(verifyOtp({ phone, code: "123456", userAgent: null })).rejects.toThrow();
    expect(findLatestActiveOtp(phone)).toBeNull();
  });

  it("rolls back code consumption and new-user creation if session persistence fails", async () => {
    challenge();
    getDb().exec("CREATE TRIGGER fail_session_insert BEFORE INSERT ON sessions BEGIN SELECT RAISE(ABORT, 'controlled session failure'); END;");
    await expect(verifyOtp({ phone, code: "123456", userAgent: null })).rejects.toThrow("controlled session failure");
    expect(findLatestActiveOtp(phone)).not.toBeNull();
    expect(getDb().prepare("SELECT COUNT(*) AS count FROM users").get()).toMatchObject({ count: 0 });
  });
});

describe("rate limits", () => {
  it("enforces a block and recovers after its window expires", () => {
    consumeRateLimit("test", { limit: 1, windowSeconds: 60 });
    expect(() => consumeRateLimit("test", { limit: 1, windowSeconds: 60 })).toThrow();
    vi.advanceTimersByTime(61_000);
    expect(() => consumeRateLimit("test", { limit: 1, windowSeconds: 60 })).not.toThrow();
  });
});

describe("SMS provider response validation", () => {
  it.each([null, {}, { return: { status: 500 } }, { return: { status: "200" } }])("rejects malformed or failed provider payload %j", async payload => {
    vi.stubEnv("SMS_PROVIDER", "kavenegar");
    vi.stubEnv("KAVENEGAR_API_KEY", "test-not-a-live-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendOtpSms(phone, "123456")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("accepts an explicitly successful provider response", async () => {
    vi.stubEnv("SMS_PROVIDER", "kavenegar");
    vi.stubEnv("KAVENEGAR_API_KEY", "test-not-a-live-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ return: { status: 200 } }), { status: 200 })));
    await expect(sendOtpSms(phone, "123456")).resolves.toBeUndefined();
  });
});
