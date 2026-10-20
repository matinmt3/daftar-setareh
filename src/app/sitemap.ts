import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/lib/seo";
import { getSiteOrigin } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin();
  return PUBLIC_PATHS.map((path) => ({ url: new URL(path, origin).toString() }));
}
