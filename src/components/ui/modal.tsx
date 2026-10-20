"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const widths = {
  sm: "34rem",
  md: "42rem",
  lg: "52rem",
  xl: "64rem",
} as const;

const ModalPendingContext = createContext<((pending: boolean) => void) | null>(null);

export function useModalPending(pending: boolean) {
  const setPending = useContext(ModalPendingContext);
  useEffect(() => {
    setPending?.(pending);
    return () => setPending?.(false);
  }, [pending, setPending]);
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof widths;
  className?: string;
  busy?: boolean;
}) {
  const [contentPending, setContentPending] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const blocked = busy || contentPending;
  return (
    <ModalPendingContext.Provider value={setContentPending}>
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!blocked) onOpenChange(next); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-backdrop" />
        <DialogPrimitive.Content
          className={cn("dialog-content", className)}
          style={{ width: `min(94vw, ${widths[size]})` }}
          aria-busy={blocked}
          onOpenAutoFocus={() => {
            // Controlled dialogs do not have a Radix Trigger ref to restore automatically.
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected && opener.current !== document.body) {
              event.preventDefault();
              opener.current.focus({ preventScroll: true });
            }
          }}
          onEscapeKeyDown={(event) => { if (blocked) event.preventDefault(); }}
          onInteractOutside={(event) => { if (blocked) event.preventDefault(); }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-extrabold text-ink">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1.5 text-xs leading-6 text-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-[#f2ede3] hover:text-ink"
              aria-label="بستن"
              disabled={blocked}
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div>{children}</div>
          {footer ? <div className="mt-5 flex flex-wrap items-center justify-end gap-2">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    </ModalPendingContext.Provider>
  );
}
