import { AppError } from "./errors";

export type SmsProvider = "console" | "kavenegar" | "none";

export function smsProvider(): SmsProvider {
  const value = (process.env.SMS_PROVIDER ?? "none").toLowerCase();
  if (value === "console" || value === "kavenegar") return value;
  return "none";
}

export function isDeveloperOtpVisible(): boolean {
  return smsProvider() === "console" && process.env.NODE_ENV !== "production";
}

export function otpMessage(code: string): string {
  return `دفتر ستاره\nکد ورود شما: ${code}\nاین کد را در اختیار دیگران قرار ندهید.`;
}

async function sendWithKavenegar(phone: string, message: string): Promise<void> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  if (!apiKey) {
    throw new AppError("سرویس پیامک تنظیم نشده است. KAVENEGAR_API_KEY را در تنظیمات سرور قرار بده.", {
      code: "sms_not_configured",
    });
  }
  const endpoint = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`;
  const body = new URLSearchParams({ receptor: phone, message });
  const sender = process.env.KAVENEGAR_SENDER?.trim();
  if (sender) body.set("sender", sender);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
  } catch {
    throw new AppError("ارسال پیامک انجام نشد. لطفاً دوباره تلاش کن.", { code: "sms_failed" });
  }
  if (!response.ok) {
    throw new AppError("ارسال پیامک انجام نشد. لطفاً دوباره تلاش کن.", { code: "sms_failed" });
  }
  const payload = (await response.json().catch(() => null)) as
    | { return?: { status?: number; message?: string } }
    | null;
  if (payload?.return?.status !== 200) {
    throw new AppError("سرویس پیامک درخواست را نپذیرفت. لطفاً بعداً تلاش کن.", { code: "sms_failed" });
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const provider = smsProvider();
  if (provider === "none") {
    throw new AppError(
      "ورود با پیامک در این نسخه فعال نیست. SMS_PROVIDER را برای ارسال واقعی تنظیم کن.",
      { code: "sms_disabled" },
    );
  }
  if (provider === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(
        "در محیط تولید نمی‌توان کد تأیید را فقط در کنسول نمایش داد. سرویس پیامک واقعی را تنظیم کن.",
        { code: "sms_console_in_production" },
      );
    }
    console.info(`[daftar-setareh] کد تأیید برای ${phone}: ${code}`);
    return;
  }
  await sendWithKavenegar(phone, otpMessage(code));
}
