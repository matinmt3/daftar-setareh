import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { fa, faDigits, formatFullDate, todayISO, WEEKDAYS, type Subject } from './core';
import { addMonthsISO, formatMonthYear, jalaliParts, monthCalendar, monthKeyToRange } from '../src/lib/dates';

export function Icon({ name, size = 20 }: { name: 'plus' | 'edit' | 'delete' | 'check' | 'back' | 'next' | 'book'; size?: number }) {
  const Component = { plus: Plus, edit: Pencil, delete: Trash2, check: Check, back: ArrowLeft, next: ChevronLeft, book: BookOpen }[name];
  return <Component size={size} aria-hidden="true" strokeWidth={1.8} />;
}
export function Button({ children, kind = 'secondary', icon, type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: Parameters<typeof Icon>[0]['name'] }) {
  return <button type={type} {...props} className={`button ${kind} ${props.className ?? ''}`}>{icon && <Icon name={icon} size={18} />}{children}</button>;
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function SubjectSelect({ subjects, value, onChange, optional = false, name = 'subjectId' }: { subjects: Subject[]; value?: string; onChange?: (value: string) => void; optional?: boolean; name?: string }) {
  return <select name={name} value={onChange ? value : undefined} defaultValue={onChange ? undefined : value} onChange={onChange ? e => onChange(e.target.value) : undefined} required={!optional}>
    {optional && <option value="">بدون درس</option>}
    {subjects.filter(s => !s.archived || s.id === value).map(subject => <option key={subject.id} value={subject.id}>{subject.name}{subject.archived ? ' (بایگانی)' : ''}</option>)}
  </select>;
}
export function DateField({ label = 'تاریخ', value, onChange, name = 'date' }: { label?: string; value: string; onChange: (value: string) => void; name?: string }) {
  const id = useId(), ref = useRef<HTMLDetailsElement>(null), [cursor, setCursor] = useState(value || todayISO());
  useEffect(() => { if (value) setCursor(value); }, [value]);
  const calendar = monthCalendar(cursor), current = jalaliParts(cursor), months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  function choose(day: string) { onChange(day); setCursor(day); if (ref.current) { ref.current.open = false; ref.current.querySelector('summary')?.focus(); } }
  function changeMonth(year: number, month: number) { setCursor(monthKeyToRange(`${year}-${String(month).padStart(2, '0')}`).start); }
  return <div className="field date-field"><span id={`${id}-label`}>{label}</span><input type="hidden" name={name} value={value} /><details ref={ref} className="date-picker"><summary aria-labelledby={`${id}-label ${id}-value`}><span id={`${id}-value`}>{formatFullDate(value || todayISO())}</span><span aria-hidden="true">⌄</span></summary><div className="date-calendar" role="group" aria-label={`انتخاب ${label} به شمسی`}><div className="calendar-nav"><button type="button" disabled={current.year === 1300 && current.month === 1} onClick={() => setCursor(addMonthsISO(cursor, -1))}>ماه قبل</button><strong>{faDigits(formatMonthYear(cursor))}</strong><button type="button" disabled={current.year === 1500 && current.month === 12} onClick={() => setCursor(addMonthsISO(cursor, 1))}>ماه بعد</button></div><div className="calendar-jump"><label><span className="sr-only">ماه {label}</span><select value={current.month} onChange={e => changeMonth(current.year, Number(e.target.value))}>{months.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}</select></label><label><span className="sr-only">سال {label}</span><select value={current.year} onChange={e => changeMonth(Number(e.target.value), current.month)}>{Array.from({ length: 201 }, (_, i) => i + 1300).map(year => <option key={year} value={year}>{faDigits(String(year))}</option>)}</select></label></div><div className="calendar-grid">{WEEKDAYS.map(day => <span className="calendar-weekday" key={day.value}>{day.label.slice(0, 1)}</span>)}{calendar.cells.map(cell => { const year = jalaliParts(cell.dateISO).year; return <button key={cell.dateISO} type="button" className={`${cell.inMonth ? '' : 'outside'} ${cell.dateISO === value ? 'selected' : ''} ${cell.isToday ? 'today' : ''}`} aria-label={formatFullDate(cell.dateISO)} aria-pressed={cell.dateISO === value} disabled={year < 1300 || year > 1500} onClick={() => choose(cell.dateISO)}>{fa(cell.day)}</button>; })}</div><button type="button" className="calendar-today" onClick={() => choose(todayISO())}>انتخاب امروز</button></div></details></div>;
}
export function Form({ onSave, children, onCancel, submit = 'ذخیره' }: { onSave: (form: HTMLFormElement) => void; children: ReactNode; onCancel?: () => void; submit?: string }) {
  const [error, setError] = useState(''), id = useId();
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); try { onSave(event.currentTarget); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ذخیره انجام نشد. دوباره بررسی کن.'); } }
  return <form onSubmit={save} onInvalidCapture={event => { const details = (event.target as HTMLElement).closest('details'); if (details) details.open = true; }} aria-describedby={error ? id : undefined}>
    <div className="form-body">{children}</div>
    {error && <p id={id} className="error-box" role="alert">{error}</p>}
    <div className="form-actions"><Button kind="primary" type="submit">{submit}</Button>{onCancel && <Button onClick={onCancel}>انصراف</Button>}</div>
  </form>;
}
export function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {
    const dialog = ref.current, active = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(control => control.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = 'hidden'; dialog?.showModal(); dialog?.addEventListener('keydown', trapTab);
    return () => { dialog?.removeEventListener('keydown', trapTab); dialog?.close(); document.body.style.overflow = overflow; active?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="modal-heading"><div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="بستن پنجره"><X size={22} /></button></div>
    {children}
  </dialog>;
}
export function Empty({ title, children, action, level = 3 }: { title: string; children: ReactNode; action?: ReactNode; level?: 2 | 3 }) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return <div className="empty"><span className="empty-mark"><BookOpen size={24} aria-hidden="true" /></span><Heading>{title}</Heading><p>{children}</p>{action}</div>;
}
export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}
export function RowActions({ title, edit, remove }: { title: string; edit?: () => void; remove?: () => void }) {
  return <div className="row-actions">{edit && <button className="icon-button" aria-label={`ویرایش ${title}`} title="ویرایش" onClick={edit}><Pencil size={17} aria-hidden="true" /></button>}{remove && <button className="icon-button danger-ink" aria-label={`حذف ${title}`} title="حذف" onClick={remove}><Trash2 size={17} aria-hidden="true" /></button>}</div>;
}
export function ProgressBar({ value, label }: { value: number; label: string }) { return <progress max={100} value={Math.max(0, Math.min(100, value))} aria-label={label}>{fa(value)}٪</progress>; }
export function SubjectName({ subject }: { subject?: Subject }) { return <span className="subject-name">{subject && <span className="subject-dot" style={{ background: subject.color }} aria-hidden="true" />}{subject?.name ?? 'بدون درس'}</span>; }
export function Stat({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>; }
export function HelpText({ children }: { children: ReactNode }) { return <p className="help-text">{children}</p>; }


