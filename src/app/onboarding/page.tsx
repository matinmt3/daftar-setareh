import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { Brand } from "@/components/brand";
import { OnboardingForm } from "./onboarding-form";
import { Sparkles, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "آشنایی با دفتر تو",
  description: "اطلاعات تحصیلی‌ات را وارد کن تا دفتر ستاره برایت آماده شود.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/app");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 paper-grid opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-violet/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 bottom-0 size-96 rounded-full bg-coral/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2 text-[0.7rem] text-muted">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
            چند قدم تا دفتر شخصی
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-3xl">
            <div className="mb-7 text-center">
              <span className="section-eyebrow mb-2 justify-center">
                <Sparkles className="size-3.5" aria-hidden="true" />
                سلام {user.name ?? "رفیق"}!
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                دفترت را برای چه سالی آماده کنیم؟
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted">
                با چند سؤال کوتاه، درس‌های پیشنهادی و هدف روزانه‌ات را تنظیم می‌کنیم. هر زمان
                خواستی می‌توانی همه‌چیز را تغییر بدهی.
              </p>
            </div>
            <OnboardingForm initialName={user.name ?? ""} initialGrade={user.gradeLevel} />
          </div>
        </div>
      </div>
    </main>
  );
}
