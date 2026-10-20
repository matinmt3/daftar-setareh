import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarClock, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";
import { isDemoEnabled } from "@/server/demo";
import { isDeveloperOtpVisible, smsProvider } from "@/server/sms";

export const metadata: Metadata = {
  title: "ورود یا ساخت حساب",
  description: "ورود به دفتر ستاره برای ثبت مطالعه و برنامه‌ریزی روزانه.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};
export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? "/app" : "/onboarding");
  const provider = smsProvider();
  const loginMode = isDeveloperOtpVisible() ? "development" : provider === "kavenegar" && Boolean(process.env.KAVENEGAR_API_KEY) ? "sms" : "unavailable";
  return <main className="min-h-dvh bg-paper">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-6">
      <Brand />
      <Link href="/" className="btn btn-ghost text-sm"><ArrowRight className="size-4" aria-hidden="true" />صفحهٔ اصلی</Link>
    </header>
    <div className="mx-auto grid max-w-4xl items-start gap-8 px-5 py-6 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
      <section className="card p-5 sm:p-8">
        <h1 className="text-2xl font-extrabold text-ink">خوش آمدی</h1>
        <p className="mb-7 mt-3 text-sm leading-7 text-muted">مطالعه‌ها، برنامه و پیشرفتت را در یک دفتر نگه دار.</p>
        <AuthForm demoEnabled={isDemoEnabled()} loginMode={loginMode} />
        <p className="mt-6 text-xs leading-7 text-muted">با ادامه، <Link href="/privacy" className="font-semibold text-violet-deep underline underline-offset-4">سیاست نگهداری اطلاعات</Link> را می‌پذیری.</p>
      </section>
      <aside className="space-y-6 pt-2">
        <h2 className="text-lg font-bold">روزت را ساده‌تر بچین</h2>
        <div className="flex items-start gap-3"><BookOpen className="mt-1 size-5 shrink-0 text-violet-deep" aria-hidden="true" /><div><h3 className="text-sm font-semibold">چند دقیقه ثبت مطالعه</h3><p className="mt-2 text-sm leading-7 text-muted">درس و زمان مطالعه را وارد کن؛ یادداشت‌ها اختیاری هستند.</p></div></div>
        <div className="flex items-start gap-3"><CalendarClock className="mt-1 size-5 shrink-0 text-violet-deep" aria-hidden="true" /><div><h3 className="text-sm font-semibold">قدم بعدی روشن</h3><p className="mt-2 text-sm leading-7 text-muted">جلسه‌های امروز و آزمون بعدی را یکجا ببین.</p></div></div>
        <div className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-violet-deep" aria-hidden="true" /><div><h3 className="text-sm font-semibold">دفتر شخصی</h3><p className="mt-2 text-sm leading-7 text-muted">داده‌های نسخهٔ سروری فقط در حساب خودت نمایش داده می‌شوند.</p></div></div>
      </aside>
    </div>
  </main>;
}
