import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";
import { isDemoEnabled } from "@/server/demo";

export const metadata: Metadata = {
  title: "ورود یا ساخت حساب",
  description: "با شمارهٔ موبایل وارد دفتر ستاره شو و دفتر روزانهٔ مطالعه‌ات را بساز.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? "/app" : "/onboarding");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 paper-grid opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1400px] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="flex flex-col px-5 py-5 sm:px-10 sm:py-7">
          <div className="flex items-center justify-between">
            <Brand />
            <Link href="/" className="btn btn-ghost min-h-8 px-2 text-xs">
              <ArrowRight className="size-3.5" aria-hidden="true" />
              صفحهٔ اصلی
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[27rem] flex-1 flex-col justify-center py-10">
            <div className="mb-7">
              <span className="section-eyebrow mb-3">
                <Sparkles className="size-3.5" aria-hidden="true" />
                شروع مسیر مطالعه
              </span>
              <h1 className="text-[1.85rem] font-extrabold leading-[1.5] tracking-tight text-ink sm:text-[2.15rem]">
                خوش آمدی به دفترِ
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-violet-deep">ستاره‌هایت</span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 rounded-full bg-gold/35" aria-hidden="true" />
                </span>
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted">
                با شمارهٔ موبایلت وارد شو؛ نه رمز عبور لازم داری، نه فرم طولانی. فقط چند قدم تا
                داشبورد شخصی‌ات مانده.
              </p>
            </div>

            <AuthForm demoEnabled={isDemoEnabled()} />

            <div className="mt-7 flex items-start gap-2 rounded-xl bg-[#f3efe6] px-3.5 py-3 text-[0.7rem] leading-6 text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#157a5b]" aria-hidden="true" />
              <p>
                اطلاعات تو خصوصی است. دفتر ستاره برای دانش‌آموزان هیچ پروفایل عمومی نمی‌سازد و داده‌ها
                فقط در حساب خودت نگهداری می‌شوند.
              </p>
            </div>
          </div>

          <p className="text-center text-[0.65rem] leading-6 text-muted">
            با ادامه، قوانین استفادهٔ منصفانه و نگهداری داده را می‌پذیری.
          </p>
        </section>

        <section className="relative hidden overflow-hidden bg-night lg:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(109,91,246,0.4),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(242,116,139,0.24),transparent_30%),radial-gradient(circle_at_60%_45%,rgba(229,178,60,0.1),transparent_28%)]" />
          <div className="absolute inset-0 paper-grid opacity-[0.07]" />
          <svg className="absolute inset-0 size-full opacity-70" viewBox="0 0 600 900" fill="none">
            <circle cx="120" cy="170" r="2.2" fill="#F4C95D" />
            <circle cx="470" cy="120" r="1.8" fill="#fff" opacity=".7" />
            <circle cx="520" cy="330" r="2.6" fill="#F2748B" />
            <circle cx="90" cy="610" r="1.7" fill="#fff" opacity=".55" />
            <circle cx="430" cy="720" r="2" fill="#F4C95D" opacity=".8" />
            <circle cx="320" cy="90" r="1.4" fill="#fff" opacity=".6" />
            <path d="M120 170c70-40 100-70 150-45" stroke="#fff" strokeOpacity=".12" strokeDasharray="3 8" />
            <path d="M470 120c-30 70-20 120 50 210" stroke="#fff" strokeOpacity=".1" strokeDasharray="3 8" />
          </svg>

          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-2 text-white/65">
              <Star className="size-4 fill-gold text-gold" />
              <span className="text-xs font-semibold">هر روز یک صفحهٔ تازه</span>
            </div>

            <div className="relative mx-auto w-full max-w-[24rem]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-violet/20 blur-3xl" />
              <div className="relative -rotate-3 rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.4rem] bg-cream p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.62rem] font-semibold text-muted">کارنامهٔ هفتهٔ دوم</p>
                      <p className="mt-1 text-sm font-extrabold text-ink">ستارهٔ نمونه</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-soft">
                      <Star className="size-5 fill-violet text-violet" />
                    </span>
                  </div>
                  <div className="my-4 h-px bg-line" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[0.6rem] text-muted">میانگین هفته</p>
                      <p className="num mt-1 text-3xl font-extrabold text-ink">
                        ۱۸٫۴
                        <span className="mr-1 text-xs font-medium text-muted">از ۲۰</span>
                      </p>
                    </div>
                    <span className="badge bg-mint-soft text-[#157a5b]">▲ ۰٫۸ بهتر از قبل</span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {[
                      ["ریاضی", 92, "#6C5CE7"],
                      ["فارسی", 84, "#F06E86"],
                      ["علوم", 78, "#13B5A6"],
                    ].map(([label, value, color]) => (
                      <div key={String(label)}>
                        <div className="mb-1 flex items-center justify-between text-[0.62rem]">
                          <span className="text-ink-soft">{label}</span>
                          <span className="num text-muted">{value}٪</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eee7db]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${value}%`, backgroundColor: String(color) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-gold-soft px-3 py-2 text-[0.62rem] text-[#7c5c12]">
                    <Sparkles className="size-3.5" />
                    این هفته ۹ ساعت و ۴۰ دقیقه مطالعه کردی.
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 rotate-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
                <p className="text-[0.6rem] text-white/60">زنجیرهٔ مطالعه</p>
                <p className="mt-0.5 text-sm font-bold">۲۴ روز پیاپی</p>
              </div>
            </div>

            <div className="max-w-sm">
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star key={item} className="size-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-lg font-bold leading-9 text-white">
                «هر شب چند دقیقه نوشتن، فردا را روشن‌تر می‌کند.»
              </p>
              <div className="mt-5 flex items-center gap-2 text-[0.68rem] text-white/55">
                <LockKeyhole className="size-3.5" />
                داده‌های تحصیلی در حساب شخصی تو
                <Check className="size-3.5 text-mint" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
