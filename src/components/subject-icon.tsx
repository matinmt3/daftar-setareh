import {
  Atom,
  BookOpen,
  Calculator,
  Code2,
  Dumbbell,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Leaf,
  Music,
  Palette,
} from "lucide-react";
import { subjectColor } from "@/lib/constants";
import { cn } from "@/lib/cn";

const icons = {
  "book-open": BookOpen,
  calculator: Calculator,
  flask: FlaskConical,
  globe2: Globe2,
  languages: Languages,
  atom: Atom,
  palette: Palette,
  dumbbell: Dumbbell,
  landmark: Landmark,
  leaf: Leaf,
  music: Music,
  code: Code2,
} as const;

export function SubjectIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const palette = subjectColor(color);
  const Icon = icons[(icon ?? "book-open") as keyof typeof icons] ?? BookOpen;
  const sizes = {
    sm: "size-7 rounded-lg",
    md: "size-9 rounded-xl",
    lg: "size-12 rounded-2xl",
  };
  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  };
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", sizes[size], className)}
      style={{ backgroundColor: palette.soft, color: palette.hex }}
      aria-hidden="true"
    >
      <Icon className={iconSizes[size]} />
    </span>
  );
}

export function SubjectDot({ color, className }: { color: string | null | undefined; className?: string }) {
  const palette = subjectColor(color);
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: palette.hex }}
      aria-hidden="true"
    />
  );
}
