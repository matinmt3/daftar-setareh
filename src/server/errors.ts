import type { SerializedActionResult } from "@/lib/types";

export class AppError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    options?: {
      code?: string;
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "app_error";
    this.fieldErrors = options?.fieldErrors;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "برای ادامه باید وارد حساب شوی.") {
    super(message, { code: "unauthorized" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "موردی پیدا نشد.") {
    super(message, { code: "not_found" });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, { code: "conflict", fieldErrors });
  }
}

export function actionError(error: unknown): Extract<SerializedActionResult, { ok: false }> {
  if (error instanceof AppError) {
    return {
      ok: false,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("UNIQUE constraint failed") || message.includes("unique constraint")) {
    return { ok: false, message: "این مورد از قبل ثبت شده است." };
  }
  console.error("[daftar-setareh]", error);
  return {
    ok: false,
    message: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کن.",
  };
}

export function formatRetry(seconds: number): string {
  if (seconds <= 60) return `${Math.max(1, Math.ceil(seconds))} ثانیه`;
  return `${Math.ceil(seconds / 60)} دقیقه`;
}
