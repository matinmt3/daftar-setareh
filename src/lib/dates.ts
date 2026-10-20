import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getDate as getJalaliDate,
  getMonth as getJalaliMonth,
  getYear as getJalaliYear,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import { fromZonedTime } from "date-fns-tz";
import { TEHRAN_TIMEZONE, WEEKDAYS } from "./constants";
import { faNum, toPersianDigits } from "./format";

export type DateRange = { start: string; end: string };
export type PeriodType = "weekly" | "monthly";
export type AnalyticsRange = "this-month" | "last-month" | "last-30" | "last-90" | "all";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseISODate(value: string): Date {
  if (!isValidISODate(value)) {
    throw new Error(`تاریخ نامعتبر است: ${value}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentHourTehran(): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(hour) % 24;
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

export function currentTimeTehran(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TEHRAN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const safe = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function durationBetween(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

export function addDaysISO(dateISO: string, amount: number): string {
  return toISODate(addDays(parseISODate(dateISO), amount));
}

export function addMonthsISO(dateISO: string, amount: number): string {
  return toISODate(addMonths(parseISODate(dateISO), amount));
}

export function diffDaysISO(from: string, to: string): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

export function isDateInRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function weekRange(dateISO = todayISO()): DateRange {
  const date = parseISODate(dateISO);
  const start = startOfWeek(date, { weekStartsOn: 6 });
  const end = endOfWeek(date, { weekStartsOn: 6 });
  return { start: toISODate(start), end: toISODate(end) };
}

export function monthRange(dateISO = todayISO()): DateRange {
  const date = parseISODate(dateISO);
  return {
    start: toISODate(startOfMonth(date)),
    end: toISODate(endOfMonth(date)),
  };
}

export function previousWeekRange(dateISO = todayISO()): DateRange {
  return weekRange(toISODate(subWeeks(parseISODate(weekRange(dateISO).start), 1)));
}

export function previousMonthRange(dateISO = todayISO()): DateRange {
  const previous = subMonths(parseISODate(monthRange(dateISO).start), 1);
  return monthRange(toISODate(previous));
}

export function getPeriodRange(type: PeriodType, dateISO = todayISO()): DateRange {
  return type === "weekly" ? weekRange(dateISO) : monthRange(dateISO);
}

export function getPreviousPeriodRange(type: PeriodType, periodStart: string): DateRange {
  return type === "weekly"
    ? weekRange(toISODate(subWeeks(parseISODate(periodStart), 1)))
    : monthRange(toISODate(subMonths(parseISODate(periodStart), 1)));
}

export function completedPeriodRanges(type: PeriodType, today = todayISO(), count = 8): DateRange[] {
  const current = getPeriodRange(type, today);
  const ranges: DateRange[] = [];
  let cursor = current.start;
  for (let index = 0; index < count; index += 1) {
    const previous = getPreviousPeriodRange(type, cursor);
    if (previous.end < today) ranges.push(previous);
    cursor = previous.start;
  }
  return ranges;
}

export function weekDays(dateISO = todayISO()): string[] {
  const range = weekRange(dateISO);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(range.start, index));
}

export function formatJalali(
  dateISO: string,
  pattern: string,
  options?: { digits?: boolean },
): string {
  const date = parseISODate(dateISO);
  const output = format(date, pattern, { locale: faIR });
  return options?.digits === false ? output.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))) : output;
}

export function formatFullDate(dateISO: string): string {
  return formatJalali(dateISO, "EEEE d MMMM yyyy");
}

export function formatShortDate(dateISO: string): string {
  return formatJalali(dateISO, "d MMMM");
}

export function formatNumericDate(dateISO: string): string {
  return formatJalali(dateISO, "yyyy/MM/dd");
}

export function formatMonthYear(dateISO: string): string {
  return formatJalali(dateISO, "MMMM yyyy");
}

export function formatMonthName(dateISO: string): string {
  return formatJalali(dateISO, "MMMM");
}

export function formatWeekday(dateISO: string): string {
  return formatJalali(dateISO, "EEEE");
}

export function formatTimePersian(time: string | null | undefined): string {
  if (!time) return "—";
  return toPersianDigits(time);
}

export function formatPeriodLabel(range: DateRange, type: PeriodType): string {
  if (type === "monthly") return formatMonthYear(range.start);
  return `${formatShortDate(range.start)} تا ${formatShortDate(range.end)} ${formatJalali(range.end, "yyyy")}`;
}

export function formatPeriodTitle(range: DateRange, type: PeriodType): string {
  return type === "monthly"
    ? `کارنامهٔ ${formatMonthYear(range.start)}`
    : `کارنامهٔ هفتهٔ ${formatPeriodLabel(range, "weekly")}`;
}

export function jalaliParts(dateISO: string): { year: number; month: number; day: number } {
  const date = parseISODate(dateISO);
  return {
    year: getJalaliYear(date),
    month: getJalaliMonth(date) + 1,
    day: getJalaliDate(date),
  };
}

export function monthKey(dateISO: string): string {
  const { year, month } = jalaliParts(dateISO);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthKeyToRange(key: string): DateRange {
  const [year, month] = key.split("-").map(Number);
  if (!validYearWindow(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`کلید ماه نامعتبر است: ${key}`);
  }
  const first = parse(`${year}/${month}/1`, "yyyy/M/d", new Date(), { locale: faIR });
  return monthRange(toISODate(first));
}

export type CalendarCell = {
  dateISO: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  weekday: number;
};

export function monthCalendar(monthDateISO = todayISO()): {
  cells: CalendarCell[];
  monthLabel: string;
  range: DateRange;
} {
  const monthStart = startOfMonth(parseISODate(monthDateISO));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const today = todayISO();
  const cells: CalendarCell[] = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      dateISO: toISODate(date),
      day: getJalaliDate(date),
      inMonth: isSameMonth(date, monthStart),
      isToday: toISODate(date) === today,
      weekday: date.getDay(),
    };
  });
  return {
    cells,
    monthLabel: formatMonthYear(toISODate(monthStart)),
    range: monthRange(toISODate(monthStart)),
  };
}

export function startOfWeekISO(dateISO: string): string {
  return weekRange(dateISO).start;
}

export function endOfWeekISO(dateISO: string): string {
  return weekRange(dateISO).end;
}

export function rangeLength(range: DateRange): number {
  return diffDaysISO(range.start, range.end) + 1;
}

export function enumerateDates(range: DateRange): string[] {
  const days = rangeLength(range);
  return Array.from({ length: days }, (_, index) => addDaysISO(range.start, index));
}

export function analyticsRange(preset: AnalyticsRange, today = todayISO()): DateRange {
  switch (preset) {
    case "this-month":
      return monthRange(today);
    case "last-month":
      return previousMonthRange(today);
    case "last-30":
      return { start: addDaysISO(today, -29), end: today };
    case "last-90":
      return { start: addDaysISO(today, -89), end: today };
    case "all":
    default:
      return { start: "2020-01-01", end: today };
  }
}

export function analyticsRangeLabel(preset: AnalyticsRange): string {
  switch (preset) {
    case "this-month":
      return "این ماه";
    case "last-month":
      return "ماه قبل";
    case "last-30":
      return "۳۰ روز اخیر";
    case "last-90":
      return "۹۰ روز اخیر";
    case "all":
      return "همهٔ دوره‌ها";
  }
}

export function analyticsRangeDisplay(range: DateRange): string {
  if (range.start === "2020-01-01") return "از ابتدا تا امروز";
  return `${formatShortDate(range.start)} تا ${formatShortDate(range.end)}`;
}

export function relativeDayLabel(dateISO: string): string {
  const diff = diffDaysISO(todayISO(), dateISO);
  if (diff === 0) return "امروز";
  if (diff === 1) return "فردا";
  if (diff === -1) return "دیروز";
  if (diff > 1) return `${faNum(diff)} روز دیگر`;
  return `${faNum(Math.abs(diff))} روز پیش`;
}

export function weekdayLabel(dateISO: string): string {
  return formatJalali(dateISO, "EEEE");
}

export function isWeekend(dateISO: string): boolean {
  const day = parseISODate(dateISO).getDay();
  return day === 5;
}

export function toTehranInstant(dateISO: string, time: string): Date {
  return fromZonedTime(`${dateISO}T${time}:00`, TEHRAN_TIMEZONE);
}

export function weekStartLabel(dateISO = todayISO()): string {
  const range = weekRange(dateISO);
  return `${formatShortDate(range.start)} تا ${formatShortDate(range.end)}`;
}

export function weekdayOrder() {
  return WEEKDAYS;
}

export function validYearWindow(year: number): boolean {
  return year >= 1300 && year <= 1500;
}
