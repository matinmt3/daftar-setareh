"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ChartNoAxesCombined,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  ScrollText,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/app", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/app/reports", label: "گزارش روزانه", icon: NotebookPen },
  { href: "/app/exams", label: "آزمون‌ها", icon: GraduationCap },
  { href: "/app/cards", label: "کارنامه‌ها", icon: ScrollText },
  { href: "/app/planner", label: "برنامهٔ مطالعه", icon: CalendarClock },
  { href: "/app/analytics", label: "تحلیل و پیشرفت", icon: ChartNoAxesCombined },
  { href: "/app/settings", label: "تنظیمات", icon: Settings2 },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="بخش‌های برنامه">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.83rem] font-semibold transition-all",
              active
                ? "bg-night text-white shadow-[0_12px_24px_-14px_rgba(33,27,63,0.8)]"
                : "text-ink-soft hover:bg-[#f2ede3] hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "size-4 transition-transform group-hover:-rotate-3",
                active ? "text-[#f4c95d]" : "text-muted",
              )}
              aria-hidden="true"
            />
            {item.label}
            {active ? <span className="mr-auto size-1.5 rounded-full bg-[#f4c95d]" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [navItems[0], navItems[1], navItems[4], navItems[2], navItems[3]];
  return (
    <nav
      className="app-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#e6ded1] bg-cream/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="ناوبری اصلی"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.6rem] font-semibold transition-colors",
                active ? "text-violet-deep" : "text-muted hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-violet-soft" : "",
                )}
              >
                <Icon className="size-[1.1rem]" aria-hidden="true" />
              </span>
              {item.label === "گزارش روزانه" ? "گزارش" : item.label === "برنامهٔ مطالعه" ? "برنامه" : item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
