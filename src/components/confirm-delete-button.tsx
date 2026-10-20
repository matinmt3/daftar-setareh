"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { SerializedActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { showToast } from "@/components/ui/toast";
import { runAction } from "@/components/ui/run-action";

export function ConfirmDeleteButton({
  action,
  title,
  description,
  redirectTo,
  label = "حذف",
  compact = false,
  onDone,
}: {
  action: () => Promise<SerializedActionResult<unknown>>;
  title: string;
  description: string;
  redirectTo?: string;
  label?: string;
  compact?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await runAction(action);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      showToast({ title: result.message ?? "حذف شد", tone: "success" });
      if (redirectTo) router.push(redirectTo);
      onDone?.();
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={compact ? "text-muted hover:bg-coral-soft hover:text-[#c73554]" : "text-[#c73554] hover:bg-coral-soft"}
        aria-label={label}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {compact ? null : label}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        busy={pending}
        title={title}
        description={description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              انصراف
            </Button>
            <Button variant="danger" onClick={confirm} loading={pending}>
              بله، حذف کن
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-2.5 rounded-xl border border-[#ffd2db] bg-coral-soft px-3.5 py-3 text-xs leading-6 text-[#9e2c46]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>این کار قابل بازگشت نیست. مطمئن شو که به آن نیاز نداری.</p>
        </div>
        {error ? <p className="mt-2 text-xs text-[#c73554]" role="alert">{error}</p> : null}
      </Modal>
    </>
  );
}
