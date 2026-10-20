const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => persianDigits[Number(digit)]);
}

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

const numberFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });
const decimalFormatter = new Intl.NumberFormat("fa-IR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function faNum(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return numberFormatter.format(value);
}

export function faDecimal(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return decimalFormatter.format(value);
}

export function faPercent(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${faNum(Math.round(value))}٪`;
}

export function faScoreFromPercent(
  percent: number | null | undefined,
  scale: number,
  fallback = "—",
): string {
  if (percent === null || percent === undefined || Number.isNaN(percent)) return fallback;
  return faDecimal((percent / 100) * scale);
}

export function scaleValue(percent: number | null | undefined, scale: number): number | null {
  if (percent === null || percent === undefined || Number.isNaN(percent)) return null;
  return Math.round((percent / 100) * scale * 10) / 10;
}

export function faMinutes(minutes: number | null | undefined, fallback = "—"): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return fallback;
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${faNum(rest)} دقیقه`;
  if (rest === 0) return `${faNum(hours)} ساعت`;
  return `${faNum(hours)} ساعت و ${faNum(rest)} دقیقه`;
}

export function faMinutesShort(minutes: number | null | undefined, fallback = "—"): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return fallback;
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${faNum(rest)}د`;
  if (rest === 0) return `${faNum(hours)}س`;
  return `${faNum(hours)}س ${faNum(rest)}د`;
}

export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length < 7) return trimmed;
  return toPersianDigits(`${trimmed.slice(0, 4)}***${trimmed.slice(-3)}`);
}

export function faTime(time: string | null | undefined): string {
  if (!time) return "—";
  return toPersianDigits(time);
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "شب بخیر";
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "ظهر بخیر";
  if (hour < 20) return "عصر بخیر";
  return "شب بخیر";
}

const relativeDays = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });

export function faRelativeDays(days: number): string {
  return relativeDays.format(days, "day");
}

export function faSigned(value: number, suffix = ""): string {
  if (value === 0) return `${faNum(0)}${suffix}`;
  return `${value > 0 ? "+" : "−"}${faNum(Math.abs(value))}${suffix}`;
}
