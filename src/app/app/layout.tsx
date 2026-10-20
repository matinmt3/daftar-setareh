import Link from "next/link";
import type { Metadata } from "next";
import { CircleHelp, LogOut, Settings2, Sparkles } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { upcomingSessions } from "@/server/repositories/planner";
import { logoutAction } from "@/server/actions/auth";
import { formatFullDate, todayISO } from "@/lib/dates";
import { gradeLabel } from "@/lib/constants";
import { Brand } from "@/components/brand";
import { MobileNav, SidebarNav } from "@/components/app-shell";
import { ReminderScheduler } from "@/components/reminders";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toast";

// Private pages stay crawlable so robots can read this noindex directive.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
  const today = todayISO();
  const upcoming = upcomingSessions(user.id, today, 20);

  return (
    <div className="app-shell-bg min-h-dvh">
      <a href="#app-main" className="sr-only z-50 focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:rounded-lg focus:bg-white focus:p-3">رفتن به محتوای اصلی</a>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1500px]">
        <aside className="app-sidebar sticky top-0 hidden h-dvh w-[15rem] shrink-0 flex-col border-l border-line bg-white px-4 py-5 lg:flex">
          <div className="px-1">
            <Brand href="/app" />
          </div>
          <div className="mt-7 flex-1 overflow-y-auto pb-4">
            <SidebarNav />
          </div>
          <div className="rounded-xl border border-line bg-paper p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet text-sm font-extrabold text-white shadow-sm">
                {(user.name ?? "س").slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{user.name ?? "دانش‌آموز"}</p>
                <p className="mt-0.5 truncate text-[0.63rem] text-muted">{gradeLabel(user.gradeLevel)}</p>
              </div>
              {user.isDemo ? (
                <Badge tone="gold" className="px-1.5 py-0.5 text-[0.58rem]">
                  نمونه
                </Badge>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Link
                href="/app/settings"
                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white text-[0.65rem] font-semibold text-ink-soft shadow-sm transition-colors hover:text-violet-deep"
              >
                <Settings2 className="size-3" aria-hidden="true" />
                تنظیمات
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-[0.65rem] font-semibold text-muted transition-colors hover:bg-coral-soft hover:text-[#c73554]"
                >
                  <LogOut className="size-3" aria-hidden="true" />
                  خروج
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="app-topbar sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Brand href="/app" compact />
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted lg:flex">
              <span className="size-2 rounded-full bg-violet" aria-hidden="true" />
              <span>{formatFullDate(today)}</span>
              {user.isDemo ? (
                <Badge tone="gold">
                  <Sparkles className="size-3" aria-hidden="true" />
                  حساب نمایشی
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/guide"
                className="btn btn-ghost min-h-10 px-3 text-sm"
              >
                <CircleHelp className="size-4" aria-hidden="true" />
                راهنما
              </Link>
              <Link
                href="/app/settings"
                className="flex size-9 items-center justify-center rounded-xl border border-line bg-cream text-xs font-extrabold text-violet-deep lg:hidden"
                aria-label="تنظیمات و حساب کاربری"
              >
                {(user.name ?? "س").slice(0, 1)}
              </Link>
            </div>
          </header>
          <main id="app-main" className="app-content mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
      <Toaster />
      <ReminderScheduler
        enabled={user.notificationEnabled}
        sessions={upcoming.map((session) => ({
          id: session.id,
          title: session.title,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          reminderMinutes: session.reminderMinutes,
        }))}
      />
    </div>
  );
}
