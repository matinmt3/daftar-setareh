import { NextResponse } from "next/server";
import { safeEqual } from "@/server/security";
import { ensureAllRecentCards } from "@/server/services/cards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const querySecret = new URL(request.url).searchParams.get("secret") ?? "";
  return safeEqual(bearer, secret) || safeEqual(querySecret, secret);
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET تنظیم نشده است." },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  try {
    const result = ensureAllRecentCards();
    const ok = result.errors === 0;
    return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 500 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "ساخت کارنامه‌ها با خطا روبه‌رو شد." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
