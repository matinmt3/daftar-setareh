"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { formatTimePersian } from "@/lib/dates";

type ReminderSession = {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  reminderMinutes: number;
};

type ToastItem = { key: string; title: string; time: string };

function reminderTimestamp(session: ReminderSession): number {
  const start = new Date(`${session.sessionDate}T${session.startTime}:00+03:30`).getTime();
  return start - Math.max(0, session.reminderMinutes) * 60_000;
}

export function ReminderScheduler({
  sessions,
  enabled,
}: {
  sessions: ReminderSession[];
  enabled: boolean;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;
    const notified = new Set<string>();
    const check = () => {
      const now = Date.now();
      sessions.forEach((session) => {
        if (session.reminderMinutes <= 0) return;
        const remindAt = reminderTimestamp(session);
        if (!Number.isFinite(remindAt)) return;
        if (now < remindAt || now > remindAt + 10 * 60_000) return;
        const key = `setareh-reminder:${session.id}:${session.sessionDate}:${session.startTime}:${session.reminderMinutes}`;
        if (notified.has(key)) return;
        try {
          if (window.localStorage.getItem(key)) return;
          window.localStorage.setItem(key, "1");
        } catch {
          // Private browsing/storage restrictions must not break the reminder UI.
        }
        notified.add(key);
        setToasts((current) => [
          ...current.filter((item) => item.key !== key),
          { key, title: session.title, time: formatTimePersian(session.startTime) },
        ]);
        if (
          enabled &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("دفتر ستاره | یادآور مطالعه", {
              body: `${session.title} ساعت ${formatTimePersian(session.startTime)}`,
              tag: key,
              dir: "rtl",
              lang: "fa",
            });
          } catch {
            // برخی مرورگرها اجازهٔ اعلان سیستمی نمی‌دهند؛ یادآور درون‌برنامه‌ای نمایش داده می‌شود.
          }
        }
      });
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [sessions, enabled]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 12_000);
    return () => window.clearTimeout(timeout);
  }, [toasts]);

  if (!enabled || toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 lg:bottom-5 lg:left-5"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className="flex items-start gap-3 rounded-2xl border border-[#e2d8c8] bg-cream p-3.5 shadow-[0_24px_60px_-24px_rgba(28,22,55,0.45)]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#8a6410]">
            <BellRing className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink">یادآور مطالعه</p>
            <p className="mt-0.5 text-xs leading-6 text-ink-soft">
              {toast.title} • ساعت <span className="num">{toast.time}</span>
            </p>
          </div>
          <button
            type="button"
            className="text-muted hover:text-ink"
            onClick={() => setToasts((current) => current.filter((item) => item.key !== toast.key))}
            aria-label="بستن یادآور"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
