import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";

export function Progress({
  value,
  className,
  tone = "violet",
  label,
}: {
  value: number;
  className?: string;
  tone?: "violet" | "mint" | "coral" | "gold" | "sky";
  label?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  const colors: Record<string, string> = {
    violet: "bg-gradient-to-l from-violet to-[#9a8bff]",
    mint: "bg-gradient-to-l from-mint to-[#6bdfb8]",
    coral: "bg-gradient-to-l from-coral to-[#ffa3b3]",
    gold: "bg-gradient-to-l from-gold to-[#f4d06f]",
    sky: "bg-gradient-to-l from-sky to-[#8fcdf9]",
  };
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[#ece5d9]", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      aria-label={label ?? "پیشرفت"}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", colors[tone])}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  color = "#6d5bf6",
  track = "#eee7db",
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${toPersianDigits(Math.round(safe))} درصد`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
