import { headers } from "next/headers";
import { hashIp } from "./security";

export async function requestContext(): Promise<{ ipHash: string; userAgent: string | null }> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || store.get("x-real-ip")?.trim() || "unknown";
  return {
    ipHash: hashIp(ip),
    userAgent: store.get("user-agent")?.slice(0, 300) ?? null,
  };
}
