import { toLatinDigits } from "./format";

/** A duration is a whole number of minutes, never a silently rewritten value. */
export function parseStudyMinutes(input: string): number | null {
  const value = toLatinDigits(input).trim();
  if (value === "") return 0;
  if (!/^\d+$/.test(value)) return null;
  const minutes = Number(value);
  return Number.isSafeInteger(minutes) && minutes >= 0 && minutes <= 1440 ? minutes : null;
}
