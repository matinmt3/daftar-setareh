import { NextResponse } from "next/server";
import { one } from "@/server/db/connection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const row = one<{ ok: number }>("SELECT 1 AS ok");
    return NextResponse.json({ ok: row?.ok === 1, service: "daftar-setareh" });
  } catch {
    return NextResponse.json({ ok: false, service: "daftar-setareh" }, { status: 503 });
  }
}
