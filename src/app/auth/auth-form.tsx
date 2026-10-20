"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, KeyRound, Loader2, LockKeyhole, RotateCcw, Smartphone, Sparkles } from "lucide-react";
import { demoLoginAction } from "@/server/actions/demo";
import { requestOtpAction, verifyOtpAction } from "@/server/actions/auth";
import { isValidIranianPhone, normalizePhone } from "@/lib/phone";
import { toLatinDigits, toPersianDigits } from "@/lib/format";
import { formatRetry } from "@/server/errors";
import { InlineAlert } from "@/components/ui/form";
import { cn } from "@/lib/cn";

function isRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT"),
  );
}

export function AuthForm({ demoEnabled, loginMode }: { demoEnabled: boolean; loginMode: "sms" | "development" | "unavailable" }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") {
      const timeout = window.setTimeout(() => codeRef.current?.focus(), 100);
      return () => window.clearTimeout(timeout);
    }
  }, [step]);

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);
    if (!isValidIranianPhone(phone)) {
      setError("شمارهٔ موبایل معتبر نیست. مثل ۰۹۱۲۳۴۵۶۷۸۹ وارد کن.");
      return;
    }
    if (loginMode === "unavailable") {
      setError("ورود با پیامک در این نسخه فعال نیست.");
      return;
    }
    setPending(true);
    try {
      const result = await requestOtpAction({ phone });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDevCode(result.data?.devCode ?? null);
      setStep("code");
      setCooldown(60);
      setNotice(
        result.data?.devCode
          ? "حالت توسعه: کد به‌جای پیامک واقعی، پایین نمایش داده شده است."
          : "کد تأیید به شمارهٔ تو پیامک شد.",
      );
    } catch (caught) {
      if (isRedirectError(caught)) throw caught;
      setError("ارتباط برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.");
    } finally {
      setPending(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!/^\d{6}$/.test(toLatinDigits(code))) {
      setError("کد تأیید باید ۶ رقم باشد.");
      return;
    }
    setPending(true);
    try {
      const result = await verifyOtpAction({ phone, code });
      if (!result.ok) setError(result.message);
    } catch (caught) {
      if (isRedirectError(caught)) throw caught;
      setError("ارتباط برقرار نشد. دوباره تلاش کن.");
    } finally {
      setPending(false);
    }
  }

  async function loginDemo() {
    setError(null);
    setPending(true);
    try {
      const result = await demoLoginAction();
      if (!result.ok) setError(result.message);
    } catch (caught) {
      if (isRedirectError(caught)) throw caught;
      setError("ورود نمایشی انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      {error ? (
        <div id="auth-error"><InlineAlert tone="error" className="mb-4">
          {error}
        </InlineAlert></div>
      ) : null}

      {step === "phone" ? (
        <form onSubmit={requestCode} noValidate>
          <label htmlFor="phone" className="label">
            شمارهٔ موبایل
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted">
              <span dir="ltr">+98</span>
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={toPersianDigits(phone)}
              onChange={(event) => {
                const latin = toLatinDigits(event.target.value).replace(/[^\d+]/g, "").slice(0, 13);
                setPhone(latin);
              }}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              className="field num h-12 pr-14 text-left text-base tracking-wide"
              aria-describedby={error ? "phone-hint auth-error" : "phone-hint"}
              aria-invalid={error ? true : undefined}
              disabled={pending || loginMode === "unavailable"}
              autoFocus={loginMode !== "unavailable"}
            />
            <Smartphone className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-violet/65" aria-hidden="true" />
          </div>
          <p id="phone-hint" className="mt-2 text-[0.7rem] leading-6 text-muted">
            {loginMode === "sms" ? "شمارهٔ موبایل ایران را وارد کن؛ کد تأیید با پیامک ارسال می‌شود." : loginMode === "development" ? "ورود توسعه فعال است؛ کد روی همین صفحه نمایش داده می‌شود و پیامک واقعی ارسال نمی‌شود." : demoEnabled ? "ورود با پیامک در این نسخه فعال نیست. برای دیدن امکانات از حساب نمایشی استفاده کن." : "ورود با پیامک در این نسخه فعال نیست. با مدیر سرویس تماس بگیر."}
          </p>

          <button type="submit" className="btn btn-primary mt-5 h-12 w-full text-sm" disabled={pending || loginMode === "unavailable"}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
            {pending ? "در حال ارسال کد..." : "دریافت کد تأیید"}
            {!pending ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}
          </button>

          {demoEnabled ? (
            <>
              <div className="my-5 flex items-center gap-3 text-[0.65rem] text-muted">
                <span className="h-px flex-1 bg-line" />
                یا
                <span className="h-px flex-1 bg-line" />
              </div>
              <button
                type="button"
                onClick={loginDemo}
                disabled={pending}
                className={cn("btn h-12 w-full text-sm", loginMode === "unavailable" ? "btn-primary" : "btn-secondary")}
              >
                <Sparkles className="size-4 text-gold" aria-hidden="true" />
                ورود به حساب نمایشی
              </button>
              <p className="mt-2 text-center text-[0.65rem] leading-5 text-muted">
                حساب نمونه با داده‌های آموزشی از پیش آماده، برای دیدن همهٔ بخش‌ها.
              </p>
            </>
          ) : null}
        </form>
      ) : (
        <form onSubmit={submitCode} noValidate>
          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl bg-[#f4f0e7] px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-white text-violet-deep shadow-sm">
                <Smartphone className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.63rem] text-muted">{loginMode === "development" ? "کد توسعه برای این شماره" : "کد برای این شماره فرستاده شد"}</p>
                <p className="num text-xs font-bold text-ink" dir="ltr">
                  {toPersianDigits(normalizePhone(phone) ?? phone)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-[0.68rem] font-semibold text-violet-deep hover:underline"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setNotice(null);
                setDevCode(null);
              }}
              disabled={pending}
            >
              تغییر شماره
            </button>
          </div>

          {notice ? (
            <InlineAlert tone="info" className="mb-4">
              {notice}
            </InlineAlert>
          ) : null}

          {devCode ? (
            <div className="mb-4 rounded-2xl border border-dashed border-[#e0c67f] bg-gold-soft/70 p-3 text-center">
              <p className="text-[0.62rem] font-semibold text-[#7c5c12]">کد توسعهٔ در دسترس (بدون پیامک واقعی)</p>
              <p className="num mt-1 text-2xl font-extrabold tracking-[0.25em] text-[#6b4f0c]" dir="ltr">
                {devCode}
              </p>
            </div>
          ) : null}

          <label htmlFor="otp" className="label">
            کد تأیید ۶ رقمی
          </label>
          <input
            ref={codeRef}
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            value={code}
            onChange={(event) => setCode(toLatinDigits(event.target.value).replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className={cn("field num h-14 text-center text-2xl font-bold tracking-[0.55em]")}
            aria-describedby={error ? "otp-hint auth-error" : "otp-hint"}
            aria-invalid={error ? true : undefined}
            disabled={pending}
          />
          <p id="otp-hint" className="mt-2 flex items-center justify-between text-[0.7rem] text-muted">
            <span>کد ۲ دقیقه اعتبار دارد.</span>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={pending || cooldown > 0}
              className="inline-flex items-center gap-1 font-semibold text-violet-deep disabled:text-muted"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              {cooldown > 0 ? `ارسال دوباره تا ${formatRetry(cooldown)}` : "ارسال دوباره"}
            </button>
          </p>

          <button type="submit" className="btn btn-primary mt-5 h-12 w-full text-sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
            {pending ? "در حال بررسی..." : "ورود به دفتر ستاره"}
          </button>
          <p className="mt-3 text-center text-[0.65rem] leading-6 text-muted">
            کد تأیید را در اختیار دیگران قرار نده. دفتر ستاره هرگز رمز عبور نمی‌خواهد.
          </p>
        </form>
      )}
    </div>
  );
}
