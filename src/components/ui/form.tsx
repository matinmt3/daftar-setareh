import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Children, cloneElement, isValidElement } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const messageId = htmlFor ? `${htmlFor}-${error ? "error" : "hint"}` : undefined;
  const controls = Children.map(children, (child) => {
    if (!htmlFor || !isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(child) || child.props.id !== htmlFor) return child;
    const describedBy = [child.props["aria-describedby"], (error || hint) && messageId].filter(Boolean).join(" ") || undefined;
    return cloneElement(child, { "aria-describedby": describedBy, "aria-invalid": error ? true : undefined });
  });
  return (
    <div className={cn("min-w-0", className)}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="mr-1 text-coral">*</span> : null}
      </label>
      {controls}
      {error ? (
        <p id={messageId} className="mt-1.5 flex items-center gap-1 text-xs text-[#c73554]" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[0.7rem] leading-5 text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field min-h-24 resize-y leading-7", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn("field appearance-none pl-9", className)} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
        ▾
      </span>
    </div>
  );
}

export function InlineAlert({
  tone = "error",
  title,
  children,
  className,
}: {
  tone?: "error" | "success" | "info" | "warning";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const styles = {
    error: {
      box: "border-[#ffd2db] bg-coral-soft text-[#9e2c46]",
      icon: <AlertCircle className="size-4 shrink-0" aria-hidden="true" />,
    },
    success: {
      box: "border-[#bfeedd] bg-mint-soft text-[#126b50]",
      icon: <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />,
    },
    info: {
      box: "border-[#cfe6fb] bg-sky-soft text-[#1b5f96]",
      icon: <Info className="size-4 shrink-0" aria-hidden="true" />,
    },
    warning: {
      box: "border-[#f5e1a8] bg-gold-soft text-[#7c5c12]",
      icon: <Info className="size-4 shrink-0" aria-hidden="true" />,
    },
  } as const;
  const style = styles[tone];
  return (
    <div
      className={cn("flex gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-6", style.box, className)}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="mt-0.5">{style.icon}</span>
      <div className="min-w-0">
        {title ? <p className="font-bold">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <InlineAlert>{errors.join(" ")}</InlineAlert>;
}
