import "server-only";
import { headers } from "next/headers";
import { resolveSiteOrigin } from "./site-origin";

/** Next16 headers is asynchronous: next/dist/docs/.../04-functions/headers.md. */
export async function getSiteOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return resolveSiteOrigin({
    siteUrl: process.env.SITE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    host: requestHeaders.get("host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
  });
}
