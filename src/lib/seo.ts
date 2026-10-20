import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "./constants";

export const PUBLIC_PATHS = ["/", "/guide", "/about", "/privacy"] as const;
export const HOME_TITLE = `${APP_NAME} | برنامه‌ریز درسی، گزارش مطالعه و کارنامه`;
export const HOME_DESCRIPTION = APP_DESCRIPTION;

// Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export function publicMetadata(page: { path: (typeof PUBLIC_PATHS)[number]; title: string; description: string }, origin: string): Metadata {
  const url = new URL(page.path, origin).toString();
  const image = new URL("/social-preview.png", origin).toString();
  return {
    metadataBase: new URL(origin),
    title: { absolute: page.title }, description: page.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: { type: "website", locale: "fa_IR", siteName: APP_NAME, title: page.title, description: page.description, url, images: [{ url: image, width: 1200, height: 630, type: "image/png", alt: "دفتر ستاره؛ برنامه‌ریزی درسی فارسی و کارنامهٔ تحصیلی" }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [{ url: image, alt: "دفتر ستاره؛ برنامه‌ریز درسی فارسی" }] },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
