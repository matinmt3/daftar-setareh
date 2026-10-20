import { useState } from 'react';
import { Button, DateField, Field, Form, SubjectSelect } from './components';
import { COLORS, KINDS, PRIORITIES, WEEKDAYS, addDaysISO, ascii, date, fa, numeric, recurrence, sessionTime, todayISO, uid, weekRange, type Exam, type Goal, type Notebook, type Profile, type Report, type Session, type StudyRow, type Subject, type Task } from './core';

const field = (form: HTMLFormElement, key: string) => String(new FormData(form).get(key) ?? '').trim();
const shortInput = (form: HTMLFormElement, key: string) => field(form, key);
const decimalInput = (value: number) => new Intl.NumberFormat('en-US', { useGrouping: false, maximumSignificantDigits: 17 }).format(value);
function Note({ label, name, value = '', max = 4000 }: { label: string; name: string; value?: string; max?: number }) { return <Field label={label}><textarea name={name} defaultValue={value} maxLength={max} rows={3} /></Field>; }

export function ProfileForm({ initial, onSave, onCancel }: { initial?: Profile; onSave: (profile: Omit<Profile, 'id' | 'demo'>) => void; onCancel?: () => void }) {
  return <Form onCancel={onCancel} submit={initial ? 'ذخیرهٔ تغییرات' : 'ساخت دفتر من'} onSave={form => onSave({ name: field(form, 'name'), grade: numeric(field(form, 'grade'), 1, 12, 'پایه', true), field: field(form, 'field'), dailyGoal: numeric(field(form, 'dailyGoal'), 5, 1440, 'هدف روزانه', true), scale: initial ? numeric(field(form, 'scale'), 1, 100, 'مقیاس نمره') : 20 })}>
    <Field label="نامت چیست؟"><input name="name" required maxLength={80} defaultValue={initial?.name ?? ''} autoComplete="given-name" placeholder="نام کوچک کافی است" autoFocus /></Field>
    <div className="form-grid"><Field label="پایهٔ تحصیلی"><select name="grade" defaultValue={initial?.grade ?? 9}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>پایهٔ {fa(i + 1)}</option>)}</select></Field><Field label="رشته"><select name="field" defaultValue={initial?.field ?? 'عمومی'}>{['عمومی', 'تجربی', 'ریاضی', 'انسانی', 'فنی و حرفه‌ای', ...(initial?.field && !['عمومی', 'تجربی', 'ریاضی', 'انسانی', 'فنی و حرفه‌ای'].includes(initial.field) ? [initial.field] : [])].map(f => <option key={f}>{f}</option>)}</select></Field></div>
    <Field label="هدف مطالعهٔ روزانه (دقیقه)" hint="از یک هدف کوچک شروع کن؛ هر زمان می‌توانی تغییرش بدهی."><input name="dailyGoal" inputMode="numeric" defaultValue={initial?.dailyGoal ?? 90} required maxLength={4} /></Field>
    {initial && <Field label="مقیاس نمایش نمره" hint="مثلاً ۲۰ یا ۱۰۰؛ نمرهٔ اصلی آزمون تغییر نمی‌کند."><input name="scale" inputMode="decimal" defaultValue={initial.scale} required maxLength={5} /></Field>}
  </Form>;
}
export function StudyForm({ data, initial, onSave, onCancel }: { data: Notebook; initial?: Report; onSave: (report: Report) => void; onCancel: () => void }) {
  const active = data.subjects.filter(s => !s.archived);
  const [day, setDay] = useState(initial?.date ?? todayISO());
  const [rows, setRows] = useState<Array<StudyRow & { key: string; amount: string }>>((initial?.subjects ?? (active[0] ? [{ subjectId: active[0].id, minutes: 45, note: '' }] : [])).map(row => ({ ...row, key: uid(), amount: String(row.minutes) })));
  const [tasks, setTasks] = useState<Array<Task & { key: string }>>((initial?.tasks ?? []).map(task => ({ ...task, key: uid() })));
  function updateRow(key: string, values: Partial<StudyRow & { amount: string }>) { setRows(rows.map(row => row.key === key ? { ...row, ...values } : row)); }
  return <Form onCancel={onCancel} submit="ذخیرهٔ مطالعه" onSave={form => onSave({ id: initial?.id ?? uid(), date: date(day), subjects: rows.map(row => ({ subjectId: row.subjectId, minutes: numeric(row.amount, 1, 1440, 'زمان مطالعه', true), note: row.note.trim() })), tasks: tasks.map(({ key: _key, ...task }) => ({ ...task, title: task.title.trim() })), reflection: field(form, 'reflection'), lessons: field(form, 'lessons'), exercises: field(form, 'exercises'), difficulties: field(form, 'difficulties'), nextGoals: field(form, 'nextGoals') })}>
    <DateField value={day} onChange={setDay} />
    <div className="field-group"><div className="mini-heading"><h3>چه درسی خواندی؟</h3><span>دقیقه</span></div>
      {rows.map((row, index) => <div key={row.key} className="study-row"><Field label={`درس ${fa(index + 1)}`}><SubjectSelect subjects={data.subjects.filter(s => !rows.some(other => other.key !== row.key && other.subjectId === s.id))} value={row.subjectId} onChange={value => updateRow(row.key, { subjectId: value })} /></Field><Field label={`زمان درس ${fa(index + 1)}`}><input inputMode="numeric" value={row.amount} onChange={e => updateRow(row.key, { amount: e.target.value })} maxLength={4} required /></Field><button type="button" className="icon-button remove-row" aria-label={`حذف درس ${fa(index + 1)} از گزارش`} onClick={() => setRows(rows.filter(r => r.key !== row.key))}>×</button><Field label={`یادداشت درس ${fa(index + 1)} (اختیاری)`}><input value={row.note} onChange={e => updateRow(row.key, { note: e.target.value })} maxLength={1000} /></Field></div>)}
      {active.length === 0 && <p className="help-text">در بخش «بیشتر ← درس‌ها» درس اضافه کن؛ فعلاً می‌توانی یادداشت یا کار ثبت کنی.</p>}
      {active.some(s => !rows.some(row => row.subjectId === s.id)) && rows.length < 40 && <Button kind="ghost" icon="plus" onClick={() => setRows([...rows, { key: uid(), subjectId: active.find(s => !rows.some(row => row.subjectId === s.id))?.id ?? active[0].id, minutes: 30, amount: '30', note: '' }])}>درس دیگر</Button>}
    </div>
    <Note name="reflection" label="امروز چطور گذشت؟ (اختیاری)" value={initial?.reflection} />
    <details className="form-details" open={tasks.length > 0 || undefined}><summary>کارها و جزئیات بیشتر <span>اختیاری</span></summary><div className="details-body">
      <h3>کارهای این روز</h3>{tasks.map((task, i) => <div className="task-input" key={task.key}><label className="check"><input type="checkbox" checked={task.completed} onChange={e => setTasks(tasks.map(t => t.key === task.key ? { ...t, completed: e.target.checked } : t))} /><span className="sr-only">کار {fa(i + 1)} انجام شد</span></label><input aria-label={`عنوان کار ${fa(i + 1)}`} value={task.title} required maxLength={200} placeholder="مثلاً حل تمرین صفحهٔ ۲۴" onChange={e => setTasks(tasks.map(t => t.key === task.key ? { ...t, title: e.target.value } : t))} /><button type="button" className="icon-button" aria-label={`حذف کار ${fa(i + 1)}`} onClick={() => setTasks(tasks.filter(t => t.key !== task.key))}>×</button><label className="sr-only" htmlFor={`task-subject-${task.key}`}>درس مربوط به کار {fa(i + 1)}</label><select id={`task-subject-${task.key}`} value={task.subjectId} onChange={e => setTasks(tasks.map(t => t.key === task.key ? { ...t, subjectId: e.target.value } : t))}><option value="">بدون درس</option>{data.subjects.filter(s => !s.archived || s.id === task.subjectId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>)}
      {tasks.length < 50 && <Button kind="ghost" icon="plus" onClick={() => setTasks([...tasks, { key: uid(), title: '', subjectId: '', completed: false }])}>افزودن کار</Button>}
      <Note name="lessons" label="مباحث مرورشده" value={initial?.lessons} /><Note name="exercises" label="تمرین‌ها" value={initial?.exercises} /><Note name="difficulties" label="کجا به کمک نیاز داری؟" value={initial?.difficulties} /><Note name="nextGoals" label="قدم بعدی برای فردا" value={initial?.nextGoals} />
    </div></details>
  </Form>;
}
export function ExamForm({ data, initial, onSave, onCancel }: { data: Notebook; initial?: Exam; onSave: (exam: Exam) => void; onCancel: () => void }) {
  const [day, setDay] = useState(initial?.date ?? todayISO()), [percent, setPercent] = useState(initial?.maxGrade === 100), [max, setMax] = useState(String(initial?.maxGrade === 100 ? (data.profile[0]?.scale ?? 20) : initial?.maxGrade ?? (data.profile[0]?.scale ?? 20))), [grade, setGrade] = useState(initial?.grade == null ? '' : decimalInput(initial.grade)), [modeError, setModeError] = useState('');
  function changeMode(next: boolean) {
    try {
      const rawMax = numeric(max, 1, 10000, 'نمرهٔ کامل'), currentMax = percent ? 100 : rawMax, nextMax = next ? 100 : rawMax;
      const amount = grade.trim() === '' ? null : numeric(grade, 0, currentMax, 'نمره'), scaled = amount === null ? null : amount * nextMax / currentMax;
      if (amount !== null && amount > 0 && scaled === 0) throw new Error('این نمره برای تبدیل دقیق بسیار کوچک است؛ مقیاس فعلی را نگه دار.');
      const converted = scaled === null ? '' : decimalInput(Number(scaled.toPrecision(14)));
      setGrade(converted); setPercent(next); setModeError('');
    } catch (error) { setModeError(error instanceof Error ? error.message : 'ابتدا نمره و نمرهٔ کامل را اصلاح کن.'); }
  }
  return <Form onCancel={onCancel} submit="ذخیرهٔ آزمون" onSave={form => { setModeError(''); const maximum = percent ? 100 : numeric(field(form, 'maxGrade'), 1, 10000, 'نمرهٔ کامل'), grade = field(form, 'grade'), weight = field(form, 'weight'); onSave({ id: initial?.id ?? uid(), subjectId: field(form, 'subjectId'), title: field(form, 'title'), date: date(day), grade: grade === '' ? null : numeric(grade, 0, maximum, 'نمره'), maxGrade: maximum, weight: weight === '' ? null : numeric(weight, 0.1, 10, 'ضریب'), notes: field(form, 'notes') }); }}>
    <Field label="عنوان آزمون"><input name="title" required maxLength={150} defaultValue={initial?.title ?? ''} placeholder="مثلاً آزمون فصل دوم" autoFocus /></Field>
    <Field label="درس"><SubjectSelect subjects={data.subjects} value={initial?.subjectId} /></Field><DateField value={day} onChange={setDay} />
    <label className="check"><input type="checkbox" checked={percent} onChange={e => changeMode(e.target.checked)} />ورود نمره به درصد</label>
    {modeError && <p className="error-box" role="alert">{modeError}</p>}
    <div className="form-grid"><Field label={percent ? 'درصد کسب‌شده' : 'نمرهٔ کسب‌شده'} hint="اگر هنوز اعلام نشده، خالی بگذار."><input name="grade" inputMode="decimal" value={grade} onChange={e => { setGrade(e.target.value); setModeError(''); }} maxLength={48} placeholder="هنوز اعلام نشده" /></Field><Field label="از نمرهٔ کامل"><input name="maxGrade" inputMode="decimal" value={percent ? '100' : max} onChange={e => { setMax(e.target.value); setModeError(''); }} readOnly={percent} required maxLength={8} /></Field></div>
    <details className="form-details"><summary>ضریب و یادداشت <span>اختیاری</span></summary><div className="details-body"><Field label="ضریب آزمون" hint="خالی = ضریب ۱؛ بازهٔ ۰٫۱ تا ۱۰"><input name="weight" inputMode="decimal" defaultValue={initial?.weight ?? ''} maxLength={5} /></Field><Note name="notes" label="یادداشت آزمون" value={initial?.notes} /></div></details>
  </Form>;
}
export function SessionForm({ data, initial, selectedDate, onSave, onCancel }: { data: Notebook; initial?: Session; selectedDate?: string; onSave: (sessions: Session[]) => void; onCancel: () => void }) {
  const [start, setStart] = useState(initial?.date ?? selectedDate ?? todayISO()), [end, setEnd] = useState(addDaysISO(selectedDate ?? todayISO(), 14)), [repeat, setRepeat] = useState(false), [days, setDays] = useState<number[]>([6, 1, 3]);
  return <Form onCancel={onCancel} submit={repeat ? 'ساخت جلسه‌های تکراری' : 'ذخیرهٔ برنامه'} onSave={form => {
    const time = ascii(field(form, 'time')), duration = numeric(field(form, 'duration'), 5, 600, 'مدت جلسه', true); sessionTime(time, duration);
    const dates = recurrence(start, repeat ? end : start, days, repeat), seriesId = repeat ? uid() : initial?.seriesId ?? '';
    onSave(dates.map(day => ({ id: initial?.id ?? uid(), subjectId: field(form, 'subjectId'), title: field(form, 'title'), date: day, time, duration, completed: initial?.completed ?? false, seriesId, kind: field(form, 'kind'), priority: field(form, 'priority'), notes: field(form, 'notes') })));
  }}>
    <Field label="قرار است چه کاری انجام دهی؟"><input name="title" required maxLength={150} defaultValue={initial?.title ?? ''} placeholder="مثلاً مرور و حل ۱۰ مسئله" autoFocus /></Field><Field label="درس"><SubjectSelect subjects={data.subjects} value={initial?.subjectId ?? ''} optional /></Field><DateField value={start} onChange={setStart} />
    <div className="form-grid"><Field label="شروع (ساعت)"><input type="time" name="time" defaultValue={initial?.time ?? '16:30'} required dir="ltr" /></Field><Field label="مدت (دقیقه)"><input name="duration" inputMode="numeric" defaultValue={initial?.duration ?? 45} maxLength={3} required /></Field></div>
    {!initial && <label className="check"><input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} />این برنامه تکرار شود</label>}
    {repeat && <div className="repeat-fields"><DateField label="تکرار تا تاریخ" name="end" value={end} onChange={setEnd} /><fieldset className="weekday-field"><legend>روزهای تکرار</legend><div className="weekdays">{WEEKDAYS.map(day => <label key={day.value}><input type="checkbox" checked={days.includes(day.value)} onChange={e => setDays(e.target.checked ? [...days, day.value] : days.filter(d => d !== day.value))} />{day.label}</label>)}</div></fieldset><p className="help-text">حداکثر ۱۲۰ روز؛ فقط روزهای انتخاب‌شده ساخته می‌شوند.</p></div>}
    <details className="form-details"><summary>نوع، اولویت و یادداشت <span>اختیاری</span></summary><div className="details-body"><div className="form-grid"><Field label="نوع جلسه"><select name="kind" defaultValue={initial?.kind ?? 'مطالعه'}>{KINDS.map(kind => <option key={kind}>{kind}</option>)}</select></Field><Field label="اولویت"><select name="priority" defaultValue={initial?.priority ?? 'عادی'}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></Field></div><Note name="notes" label="یادداشت برنامه" value={initial?.notes} /></div></details>
  </Form>;
}
export function GoalForm({ initial, onSave, onCancel }: { initial?: Goal; onSave: (goal: Goal) => void; onCancel: () => void }) {
  const range = weekRange(), [start, setStart] = useState(initial?.start ?? range.start), [end, setEnd] = useState(initial?.end ?? addDaysISO(todayISO(), 30)), [metric, setMetric] = useState<Goal['metric']>(initial?.metric ?? 'minutes');
  return <Form onCancel={onCancel} submit="ذخیرهٔ هدف" onSave={form => onSave({ id: initial?.id ?? uid(), title: shortInput(form, 'title'), metric, period: field(form, 'period') as Goal['period'], target: numeric(field(form, 'target'), 1, metric === 'average' ? 100 : 100000, 'مقدار هدف'), start: date(start), end: date(end), active: field(form, 'active') === 'on' })}>
    <Field label="عنوان هدف"><input name="title" required maxLength={150} defaultValue={initial?.title ?? ''} placeholder="مثلاً این هفته پیوسته‌تر درس بخوانم" autoFocus /></Field><div className="form-grid"><Field label="چه چیزی را دنبال کنیم؟"><select value={metric} onChange={e => setMetric(e.target.value as Goal['metric'])}><option value="minutes">زمان مطالعه (دقیقه)</option><option value="tasks">کارهای انجام‌شده</option><option value="average">میانگین نمره (درصد)</option></select></Field><Field label="در هر دوره"><select name="period" defaultValue={initial?.period ?? 'weekly'}><option value="daily">روز</option><option value="weekly">هفته</option><option value="monthly">ماه شمسی</option></select></Field></div><Field label={metric === 'average' ? 'درصد هدف (از ۱۰۰)' : metric === 'tasks' ? 'تعداد کار هدف' : 'دقیقهٔ هدف'}><input key={metric} name="target" inputMode="decimal" required defaultValue={initial?.metric === metric ? initial.target : (metric === 'average' ? 80 : metric === 'tasks' ? 5 : 300)} maxLength={8} /></Field>
    <div className="form-grid"><DateField label="شروع هدف" value={start} onChange={setStart} /><DateField label="پایان هدف" value={end} onChange={setEnd} /></div><label className="check"><input name="active" type="checkbox" defaultChecked={initial?.active ?? true} />هدف فعال باشد</label><p className="help-text">پیشرفت در محدودهٔ تاریخ و در دورهٔ فعلی محاسبه می‌شود؛ هفته از شنبه و ماه بر اساس تقویم شمسی است.</p>
  </Form>;
}
export function SubjectForm({ initial, onSave, onCancel }: { initial?: Subject; onSave: (subject: Subject) => void; onCancel: () => void }) {
  return <Form onCancel={onCancel} onSave={form => onSave({ id: initial?.id ?? uid(), name: field(form, 'name'), color: field(form, 'color'), archived: initial?.archived ?? false })}>
    <Field label="نام درس"><input name="name" defaultValue={initial?.name ?? ''} required maxLength={80} placeholder="مثلاً ریاضی" autoFocus /></Field><Field label="رنگ نشانهٔ درس"><input name="color" type="color" defaultValue={initial?.color ?? COLORS[0]} /></Field>
  </Form>;
}



