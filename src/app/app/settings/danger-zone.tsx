"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/form";
import { runAction } from "@/components/ui/run-action";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const result = await runAction(() => deleteAccountAction({ confirmation }));
      if (!result.ok) {
        setError(result.message);
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setConfirmation("");
          setError(null);
          setOpen(true);
        }}
        className="text-[#c73554] hover:bg-coral-soft"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        حذف حساب
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        busy={pending}
        title="حذف همیشگی حساب"
        description="همهٔ گزارش‌ها، آزمون‌ها، کارنامه‌ها، برنامه‌ها و هدف‌های این حساب پاک می‌شوند. این کار قابل بازگشت نیست."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              منصرف شدم
            </Button>
            <Button
              variant="danger"
              onClick={remove}
              loading={pending}
              disabled={confirmation.trim() !== "حذف حساب"}
            >
              حذف همیشگی حساب
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-2.5 rounded-xl border border-[#ffd2db] bg-coral-soft px-3.5 py-3 text-xs leading-6 text-[#9e2c46]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>برای تأیید، عبارت «حذف حساب» را دقیقاً بنویس.</p>
        </div>
        <Input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="حذف حساب"
          className="mt-3 bg-white"
          aria-label="عبارت تأیید حذف حساب"
        />
        {error ? <p className="mt-2 text-xs text-[#c73554]" role="alert">{error}</p> : null}
      </Modal>
    </>
  );
}
