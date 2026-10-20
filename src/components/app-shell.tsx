"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ChartNoAxesCombined, GraduationCap, House, MoreHorizontal, NotebookPen, ScrollText, Settings2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";

const primary = [
  { href: "/app", label: "امروز", icon: House, exact: true },
  { href: "/app/planner", label: "برنامه", icon: CalendarClock },
  { href: "/app/reports", label: "مطالعه‌ها", icon: NotebookPen },
  { href: "/app/exams", label: "آزمون‌ها", icon: GraduationCap },
];
const secondary = [
  { href: "/app/cards", label: "کارنامه‌ها", icon: ScrollText },
  { href: "/app/analytics", label: "تحلیل پیشرفت", icon: ChartNoAxesCombined },
  { href: "/app/settings", label: "تنظیمات و درس‌ها", icon: Settings2 },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="بخش‌های برنامه">
      <p className="mb-2 px-3 text-xs font-medium text-muted">دفتر من</p>
      {primary.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
          className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", active ? "bg-violet-soft text-violet-deep" : "text-ink-soft hover:bg-paper")}>
          <Icon className="size-5" aria-hidden="true" />{item.label}
        </Link>;
      })}
      <details className="mt-5 border-t border-line pt-3" open={secondary.some((item) => isActive(pathname, item.href)) || undefined}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted hover:bg-paper">
          <MoreHorizontal className="size-5" aria-hidden="true" />بیشتر
        </summary>
        <div className="mt-1 space-y-1">
          {secondary.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm", active ? "bg-violet-soft font-semibold text-violet-deep" : "text-ink-soft hover:bg-paper")}>
              <Icon className="size-4" aria-hidden="true" />{item.label}
            </Link>;
          })}
        </div>
      </details>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = secondary.some((item) => isActive(pathname, item.href));
  return <>
    <nav className="app-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden" aria-label="ناوبری اصلی">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {primary.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium", active ? "bg-violet-soft text-violet-deep" : "text-muted")}>
            <Icon className="size-5" aria-hidden="true" />{item.label}
          </Link>;
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}
          className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium", moreActive ? "bg-violet-soft text-violet-deep" : "text-muted")}>
          <MoreHorizontal className="size-5" aria-hidden="true" />بیشتر
        </button>
      </div>
    </nav>
    <Modal open={moreOpen} onOpenChange={setMoreOpen} title="بخش‌های دیگر" size="sm">
      <nav className="space-y-2" aria-label="بخش‌های بیشتر">
        {secondary.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-4 text-sm font-medium text-ink hover:bg-paper">
            <Icon className="size-5 text-violet-deep" aria-hidden="true" />{item.label}
          </Link>;
        })}
      </nav>
    </Modal>
  </>;
}
