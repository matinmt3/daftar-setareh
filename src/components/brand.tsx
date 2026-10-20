import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function BrandMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-[30%] bg-gradient-to-br from-night via-[#33275c] to-violet shadow-[0_10px_24px_-10px_rgba(33,27,63,0.8)]" />
      <svg viewBox="0 0 64 64" className="relative z-10 size-[78%]" fill="none">
        <path
          d="M32 10.5 37.8 25 53.5 26.7 41.8 37.4 45 52.8 32 45.1 19 52.8l3.2-15.4L10.5 26.7 26.2 25 32 10.5Z"
          fill="#F4C95D"
        />
        <circle cx="32" cy="32" r="4.2" fill="#F2748B" />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/",
  compact = false,
  light = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <BrandMark size={compact ? 34 : 42} className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display text-xl tracking-wide",
            light ? "text-white" : "text-ink",
          )}
        >
          {APP_NAME}
        </span>
        {!compact ? (
          <span className={cn("mt-0.5 text-[0.62rem]", light ? "text-white/65" : "text-muted")}>
            {APP_TAGLINE}
          </span>
        ) : null}
      </span>
      <span className="sr-only">، صفحهٔ اصلی</span>
    </Link>
  );
}
