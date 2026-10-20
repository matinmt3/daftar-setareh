"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { toggleSessionAction } from "@/server/actions/planner";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { runAction } from "@/components/ui/run-action";

export function SessionCompleteButton({
  id,
  completed,
  size = "sm",
}: {
  id: string;
  completed: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const done = pending && optimisticDone !== null ? optimisticDone : completed;

  const toggle = () => {
    const next = !done;
    setOptimisticDone(next);
    startTransition(async () => {
      const result = await runAction(() => toggleSessionAction({ id, completed: next }));
      if (!result.ok) {
        setOptimisticDone(null);
        showToast({ title: "تغییر وضعیت انجام نشد", description: result.message, tone: "error" });
        return;
      }
      showToast({
        title: next ? "جلسه انجام‌شده شد" : "جلسه به برنامه برگشت",
        tone: "success",
      });
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      aria-label={done ? "برگرداندن به حالت انجام‌نشده" : "علامت‌زدن به‌عنوان انجام‌شده"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-all",
        size === "sm" ? "size-7" : "size-9",
        done
          ? "border-mint bg-mint text-white"
          : "border-[#d8cfc0] bg-white text-muted hover:border-mint hover:text-[#157a5b]",
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : done ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <RotateCcw className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
