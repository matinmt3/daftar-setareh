"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonthsISO,
  formatMonthYear,
  formatNumericDate,
  monthCalendar,
  todayISO,
} from "@/lib/dates";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function JalaliDatePicker({
  value,
  onChange,
  name,
  id,
  label,
  placeholder = "انتخاب تاریخ",
  min,
  max,
  disabled,
  allowClear = false,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value || todayISO());
  const calendar = monthCalendar(viewMonth);
  const today = todayISO();

  const select = (date: string) => {
    onChange(date);
    setOpen(false);
  };

  const isDisabled = (date: string) => Boolean((min && date < min) || (max && date > max));

  return (
    <>
    {name ? <input type="hidden" name={name} value={value} disabled={disabled} /> : null}
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setViewMonth(value || todayISO());
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "field flex items-center justify-between gap-2 text-right",
            !value && "text-muted",
            className,
          )}
          aria-label={label ? `${label}: ${value ? formatNumericDate(value) : placeholder}` : undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-violet-deep" aria-hidden="true" />
            <span className="num">{value ? formatNumericDate(value) : placeholder}</span>
          </span>
          <span className="text-[0.65rem] text-muted">تاریخ شمسی</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[70] w-[min(19.5rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-cream p-3 shadow-[0_28px_80px_-24px_rgba(28,22,55,0.45)] outline-none"
          sideOffset={6}
          align="start"
          dir="rtl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg hover:bg-[#f1ece2]"
              onClick={() => setViewMonth(addMonthsISO(calendar.range.start, -1))}
              aria-label="ماه قبل"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <div className="text-sm font-bold text-ink">{formatMonthYear(calendar.range.start)}</div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg hover:bg-[#f1ece2]"
              onClick={() => setViewMonth(addMonthsISO(calendar.range.start, 1))}
              aria-label="ماه بعد"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[0.62rem] font-bold text-muted">
            {WEEKDAYS.map((day) => (
              <span key={day.value} className="py-1">
                {day.short}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calendar.cells.map((cell) => {
              const selected = value === cell.dateISO;
              const blocked = isDisabled(cell.dateISO);
              return (
                <button
                  key={cell.dateISO}
                  type="button"
                  disabled={blocked}
                  onClick={() => select(cell.dateISO)}
                  className={cn(
                    "num flex h-8 items-center justify-center rounded-lg text-xs transition-colors",
                    cell.inMonth ? "text-ink" : "text-[#b9b2a4]",
                    cell.isToday && !selected && "ring-1 ring-violet/45",
                    selected
                      ? "bg-violet font-bold text-white shadow-sm"
                      : "hover:bg-violet-soft hover:text-violet-deep",
                    blocked && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                  aria-label={formatNumericDate(cell.dateISO)}
                  aria-pressed={selected}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[0.7rem] font-semibold text-violet-deep hover:bg-violet-soft"
              disabled={isDisabled(today)}
              onClick={() => {
                if (!isDisabled(today)) select(today);
              }}
            >
              امروز
            </button>
            {allowClear ? (
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-[0.7rem] text-muted hover:bg-[#f1ece2]"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                پاک کردن
              </button>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    </>
  );
}
