import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeDatabase, getDb, openDatabase, setDatabaseForTests } from "@/server/db/connection";
import { createUser } from "@/server/repositories/users";
import { createSessionRecord, SESSION_COOKIE } from "@/server/repositories/sessions";
import { getCurrentUser, logoutCurrentSession, sessionCookieOptions, setSessionCookie } from "@/server/auth/session";
import { hashToken } from "@/server/security";
import { GET as cronGet, POST as cronPost } from "@/app/api/cron/report-cards/route";

const mock = vi.hoisted(() => ({ token: undefined as string | undefined, set: vi.fn(), remove: vi.fn(), cron: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => name === "setareh_session" && mock.token ? { value: mock.token } : undefined, set: mock.set, delete: mock.remove }) }));
vi.mock("@/server/services/cards", () => ({ ensureAllRecentCards: mock.cron }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T12:00:00Z"));
  setDatabaseForTests(openDatabase(":memory:"));
  mock.token = undefined;
  mock.set.mockReset();
  mock.remove.mockReset();
  mock.cron.mockReset();
});

afterEach(() => {
  closeDatabase();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("session lifecycle", () => {
  function session(expiresAt?: string) {
    const user = createUser("09121234567");
    mock.token = "test-only-session-token";
    const record = createSessionRecord({ userId: user.id, tokenHash: hashToken(mock.token), userAgent: null });
    if (expiresAt) getDb().prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(expiresAt, record.id);
    return user;
  }

  it("treats a missing or unknown cookie as unauthenticated", async () => {
    expect(await getCurrentUser()).toBeNull();
    mock.token = "unknown-token";
    expect(await getCurrentUser()).toBeNull();
  });

  it("resolves a valid token and removes expired sessions", async () => {
    const user = session("2026-10-20T12:00:00.000Z");
    expect((await getCurrentUser())?.id).toBe(user.id);
    vi.advanceTimersByTime(24 * 3600_000);
    expect(await getCurrentUser()).toBeNull();
    expect(getDb().prepare("SELECT COUNT(*) AS count FROM sessions").get()).toMatchObject({ count: 0 });
  });

  it("revokes the current token when logging out", async () => {
    session();
    await logoutCurrentSession();
    expect(mock.remove).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(await getCurrentUser()).toBeNull();
  });

  it("uses a secure, HTTP-only cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions()).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/" });
    await setSessionCookie("test-only-token");
    expect(mock.set).toHaveBeenCalledWith(SESSION_COOKIE, "test-only-token", expect.objectContaining({ secure: true, httpOnly: true }));
  });
});

describe("report-card cron status and authorization", () => {
  const request = (secret?: string) => new Request("https://example.invalid/api/cron/report-cards", { headers: secret ? { authorization: `Bearer ${secret}` } : {} });

  it("rejects unconfigured and unauthorized execution without running jobs", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await cronGet(request())).status).toBe(503);
    vi.stubEnv("CRON_SECRET", "test-only-cron-secret");
    expect((await cronPost(request("wrong"))).status).toBe(401);
    expect(mock.cron).not.toHaveBeenCalled();
  });

  it("returns a successful result when every user's cards were generated", async () => {
    vi.stubEnv("CRON_SECRET", "test-only-cron-secret");
    mock.cron.mockReturnValue({ users: 2, cards: 4, errors: 0 });
    const response = await cronPost(request("test-only-cron-secret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, users: 2, cards: 4, errors: 0 });
  });

  it("reports partial job failures as failures instead of returning a false success", async () => {
    vi.stubEnv("CRON_SECRET", "test-only-cron-secret");
    mock.cron.mockReturnValue({ users: 2, cards: 2, errors: 1 });
    const response = await cronPost(request("test-only-cron-secret"));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, errors: 1 });
  });
});
