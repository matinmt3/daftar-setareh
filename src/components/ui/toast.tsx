"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info";
type ToastPayload = { title: string; description?: string; tone?: ToastTone };
type ToastItem = ToastPayload & { id: number };

const EVENT = "setareh:toast";

export function showToast(payload: ToastPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: payload }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.title) return;
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { ...detail, id }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 5000);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-[80] flex w-[min(23rem,calc(100vw-2rem))] flex-col gap-2 lg:bottom-5 lg:right-5"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => {
        const tone = item.tone ?? "info";
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-2.5 rounded-2xl border bg-cream p-3.5 shadow-[0_24px_60px_-24px_rgba(28,22,55,0.45)]",
              tone === "success" && "border-[#bfeedd]",
              tone === "error" && "border-[#ffd2db]",
              tone === "info" && "border-[#cfe6fb]",
            )}
            role={tone === "error" ? "alert" : "status"}
          >
            <span
              className={cn(
                "mt-0.5",
                tone === "success" && "text-[#157a5b]",
                tone === "error" && "text-[#c73554]",
                tone === "info" && "text-[#1e6dad]",
              )}
            >
              {tone === "success" ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : tone === "error" ? (
                <AlertCircle className="size-4" aria-hidden="true" />
              ) : (
                <Info className="size-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-[0.7rem] leading-5 text-muted">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-muted hover:text-ink"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
              aria-label="بستن پیام"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
