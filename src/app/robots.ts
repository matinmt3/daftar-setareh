import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    // Private routes remain crawlable so bots can read their noindex/redirect.
    // https://developers.google.com/search/docs/crawling-indexing/block-indexing
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", await getSiteOrigin()).toString(),
  };
}
