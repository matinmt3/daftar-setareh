import type { Metadata } from "next";
import {
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";
import { getSubjects } from "@/server/services/subjects";
import { formatNumericDate } from "@/lib/dates";
import { toPersianDigits } from "@/lib/format";
import { PageHeader } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "./settings-form";
import { SubjectsManager } from "./subjects-manager";
import { DangerZone } from "./danger-zone";

export const metadata: Metadata = { title: "تنظیمات" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const subjects = getSubjects(user.id, true);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="حساب و تنظیمات"
        title="تنظیمات"
        description="مشخصات و هدف روزانه‌ات را تنظیم کن. درس‌ها در بخش بعدی هستند."
      />

      <div className="mx-auto max-w-3xl">
        <div className="space-y-4">
          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
                <UserRound className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-ink">مشخصات و اهداف</h2>
                <p className="mt-0.5 text-[0.6rem] text-muted">نام، پایه و هدف روزانه‌ات را به‌روز کن.</p>
              </div>
            </div>
            <SettingsForm user={user} />
          </section>

          <section id="subjects" className="card scroll-mt-24 p-4 sm:p-5">
            <SubjectsManager subjects={subjects} />
          </section>

          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-sky-soft text-[#1e6dad]">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">حساب و امنیت</h2>
                  <p className="mt-0.5 text-[0.6rem] text-muted">ورود با رمز یک‌بارمصرف و شمارهٔ موبایل.</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-secondary text-[0.65rem]">
                  <LogOut className="size-3.5" aria-hidden="true" />
                  خروج از حساب
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3 py-2.5">
                <p className="text-[0.56rem] text-muted">شمارهٔ موبایل</p>
                <p className="num mt-1 text-xs font-bold text-ink">{toPersianDigits(user.phone)}</p>
              </div>
              <div className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3 py-2.5">
                <p className="text-[0.56rem] text-muted">عضویت از</p>
                <p className="mt-1 text-xs font-bold text-ink">{formatNumericDate(user.createdAt.slice(0, 10))}</p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-soft/50 px-3 py-2.5">
              <KeyRound className="mt-0.5 size-3.5 shrink-0 text-violet-deep" aria-hidden="true" />
              <p className="text-[0.6rem] leading-5 text-violet-deep">
                کد ورود فقط دو دقیقه اعتبار دارد و حداکثر پنج بار قابل امتحان است. اگر کد را با کسی به اشتراک گذاشتی،
                همین حالا از حساب خارج شو.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div>
                <p className="text-xs font-bold text-ink">حذف حساب</p>
                <p className="mt-0.5 text-[0.58rem] text-muted">
                  همهٔ داده‌های این حساب برای همیشه پاک می‌شود.
                </p>
              </div>
              {user.isDemo ? (
                <Badge tone="gold">در حساب نمایشی غیرفعال است</Badge>
              ) : (
                <DangerZone />
              )}
            </div>
          </section>
        </div>


      </div>
    </div>
  );
}
