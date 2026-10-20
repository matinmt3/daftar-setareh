import { addDaysISO, diffDaysISO, parseISODate } from "./dates";

export const MAX_RECURRENCE_DAYS = 120;
export const MAX_RECURRENCE_OCCURRENCES = 150;

export function generateRecurrenceDates(input: {
  startDate: string;
  endDate: string;
  weekdays: number[];
}): string[] {
  const weekdays = [...new Set(input.weekdays)].filter((day) => day >= 0 && day <= 6);
  if (weekdays.length === 0) return [];
  const span = diffDaysISO(input.startDate, input.endDate);
  if (span < 0) return [];
  const cappedSpan = Math.min(span, MAX_RECURRENCE_DAYS);
  const dates: string[] = [];
  for (let offset = 0; offset <= cappedSpan; offset += 1) {
    const date = addDaysISO(input.startDate, offset);
    if (weekdays.includes(parseISODate(date).getDay())) {
      dates.push(date);
      if (dates.length >= MAX_RECURRENCE_OCCURRENCES) break;
    }
  }
  return dates;
}

export function recurrenceSummary(weekdays: number[], endDate: string): string {
  const labels = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  const names = weekdays.map((day) => labels[day]).join("، ");
  return `${names} تا ${endDate}`;
}
