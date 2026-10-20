import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-violet-deep"
          >
            <ArrowRight className="size-3.5" aria-hidden="true" />
            {backLabel ?? "بازگشت"}
          </Link>
        ) : null}
        {eyebrow ? <p className="section-eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.9rem]">{title}</h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink sm:text-base">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dcd3c4] bg-[#fdfaf4] text-center",
        compact ? "px-4 py-7" : "px-6 py-12",
        className,
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-soft text-violet-deep">
        {icon ?? <Sparkles className="size-5" aria-hidden="true" />}
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description ? <p className="mt-1.5 max-w-md text-xs leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "violet",
  delta,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "violet" | "coral" | "mint" | "gold" | "sky";
  delta?: number | null;
  className?: string;
}) {
  const tones = {
    violet: "bg-violet-soft text-violet-deep",
    coral: "bg-coral-soft text-[#c73554]",
    mint: "bg-mint-soft text-[#157a5b]",
    gold: "bg-gold-soft text-[#8a6410]",
    sky: "bg-sky-soft text-[#1e6dad]",
  } as const;
  return (
    <div className={cn("card relative overflow-hidden p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <div className="mt-2 text-[1.55rem] font-extrabold leading-none tracking-tight text-ink">
            {value}
          </div>
          {hint ? <div className="mt-2 text-[0.7rem] leading-5 text-muted">{hint}</div> : null}
        </div>
        {icon ? (
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", tones[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      {delta !== undefined && delta !== null ? (
        <Delta value={delta} className="mt-2.5" suffix="واحد درصد" />
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute -bottom-8 -left-5 size-20 rounded-full opacity-35 blur-2xl",
          tone === "violet" && "bg-violet",
          tone === "coral" && "bg-coral",
          tone === "mint" && "bg-mint",
          tone === "gold" && "bg-gold",
          tone === "sky" && "bg-sky",
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export function Delta({
  value,
  suffix = "",
  invert = false,
  className,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  className?: string;
}) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) {
    return <span className={cn("text-[0.68rem] text-muted", className)}>بدون تغییر</span>;
  }
  const positive = invert ? value < 0 : value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.68rem] font-semibold",
        positive ? "text-[#157a5b]" : "text-[#c73554]",
        className,
      )}
    >
      <span aria-hidden="true">{value > 0 ? "▲" : "▼"}</span>
      {new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(Math.abs(value))}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
