import { toLatinDigits } from "./format";

export function normalizePhone(input: string): string | null {
  let value = toLatinDigits(String(input ?? "")).trim();
  value = value.replace(/[\s\-().]/g, "");
  if (value.startsWith("+98")) value = `0${value.slice(3)}`;
  else if (value.startsWith("0098")) value = `0${value.slice(4)}`;
  else if (value.startsWith("98") && value.length === 12) value = `0${value.slice(2)}`;
  else if (value.startsWith("9") && value.length === 10) value = `0${value}`;
  if (!/^09[0-9]{9}$/.test(value)) return null;
  return value;
}

export function isValidIranianPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
