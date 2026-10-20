import Link from "next/link";
import { Brand } from "@/components/brand";
import { serializeJsonLd } from "@/lib/seo";

export function StructuredData({ value }: { value: unknown }) {
  // https://nextjs.org/docs/app/guides/json-ld
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />;
}

export function PublicLinks() {
  return <nav aria-label="اطلاعات دفتر ستاره" className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-ink-soft">
    <Link href="/" className="hover:text-violet-deep">صفحهٔ اصلی</Link>
    <Link href="/guide" className="hover:text-violet-deep">راهنمای استفاده</Link>
    <Link href="/about" className="hover:text-violet-deep">دربارهٔ دفتر ستاره</Link>
    <Link href="/privacy" className="hover:text-violet-deep">حریم خصوصی</Link>
  </nav>;
}

export function PublicPage({ heading, description, children }: { heading: string; description: string; children: React.ReactNode }) {
  return <main className="min-h-dvh bg-paper text-ink">
    <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-6 sm:px-6"><Brand /><Link href="/auth" className="btn btn-primary text-sm">ورود به دفتر</Link></header>
    <article className="mx-auto max-w-4xl px-4 pb-16 pt-7 sm:px-6"><h1 className="font-display text-4xl leading-relaxed">{heading}</h1><p className="mt-5 text-sm leading-8 text-ink-soft">{description}</p><div className="mt-10 space-y-8 text-sm [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p]:leading-9 [&_li]:leading-9 [&_a]:font-semibold [&_a]:text-violet-deep [&_a]:underline [&_a]:underline-offset-4">{children}</div></article>
    <footer className="border-t border-line bg-cream"><div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6"><PublicLinks /><p className="text-xs text-muted">دفتر ستاره؛ یک صفحهٔ تازه، هر روز</p></div></footer>
  </main>;
}
