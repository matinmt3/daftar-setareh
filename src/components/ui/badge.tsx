import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva("badge", {
  variants: {
    tone: {
      violet: "bg-violet-soft text-violet-deep",
      coral: "bg-coral-soft text-[#c73554]",
      mint: "bg-mint-soft text-[#157a5b]",
      gold: "bg-gold-soft text-[#8a6410]",
      sky: "bg-sky-soft text-[#1e6dad]",
      neutral: "bg-[#f2eee5] text-ink-soft",
      ink: "bg-night text-white",
      outline: "border border-line bg-transparent text-muted",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
