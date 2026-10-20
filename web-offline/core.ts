import { addDaysISO, diffDaysISO, formatFullDate as rawFullDate, formatNumericDate as rawNumericDate, formatShortDate as rawShortDate, isValidISODate, jalaliParts, monthRange, parseISODate, todayISO, weekRange } from '../src/lib/dates';

export { addDaysISO, diffDaysISO, monthRange, todayISO, weekRange };
export const faDigits = (value: string) => value.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
export const formatFullDate = (value: string) => faDigits(rawFullDate(value));
export const formatNumericDate = (value: string) => faDigits(rawNumericDate(value));
export const formatShortDate = (value: string) => faDigits(rawShortDate(value));
export type Profile = { id: 'local'; name: string; grade: number; field: string; scale: number; dailyGoal: number; demo: boolean };
export type Subject = { id: string; name: string; color: string; archived: boolean };
export type StudyRow = { subjectId: string; minutes: number; note: string };
export type Task = { title: string; subjectId: string; completed: boolean };
export type Report = { id: string; date: string; subjects: StudyRow[]; tasks: Task[]; lessons: string; exercises: string; difficulties: string; reflection: string; nextGoals: string };
export type Exam = { id: string; subjectId: string; title: string; date: string; grade: number | null; maxGrade: number; weight: number | null; notes: string };
export type Session = { id: string; subjectId: string; title: string; date: string; time: string; duration: number; completed: boolean; seriesId: string; kind: string; priority: string; notes: string };
export type Goal = { id: string; title: string; metric: 'minutes' | 'tasks' | 'average'; period: 'daily' | 'weekly' | 'monthly'; target: number; start: string; end: string; active: boolean };
export type Notebook = { profile: Profile[]; subjects: Subject[]; reports: Report[]; exams: Exam[]; sessions: Session[]; goals: Goal[] };
export type Collection = 'reports' | 'exams' | 'sessions' | 'goals';
export type Range = { start: string; end: string };
export const COLLECTIONS = ['profile', 'subjects', 'reports', 'exams', 'sessions', 'goals'] as const;
export const COLORS = ['#0F766E', '#B45309', '#1D4ED8', '#BE185D', '#475569', '#4D7C0F'];
export const WEEKDAYS = [{ value: 6, label: 'شنبه' }, { value: 0, label: 'یکشنبه' }, { value: 1, label: 'دوشنبه' }, { value: 2, label: 'سه‌شنبه' }, { value: 3, label: 'چهارشنبه' }, { value: 4, label: 'پنجشنبه' }, { value: 5, label: 'جمعه' }];
export const KINDS = ['مطالعه', 'تکلیف', 'مرور', 'آزمون', 'پروژه'];
export const PRIORITIES = ['عادی', 'مهم', 'خیلی مهم'];
export const emptyNotebook = (): Notebook => ({ profile: [], subjects: [], reports: [], exams: [], sessions: [], goals: [] });
export const uid = () => crypto.randomUUID();
export const fa = (value: number, digits = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value);
export const ascii = (value: string) => value.trim().replace(/[۰-۹٠-٩]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.includes(c) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[٫،]/g, '.');
export function numeric(value: string, min: number, max: number, title: string, integer = false) {
  const raw = ascii(value);
  const result = Number(raw);
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(result) || result < min || result > max || (integer && !Number.isInteger(result))) throw new Error(`${title} باید ${integer ? 'عدد صحیح ' : ''}بین ${fa(min)} و ${fa(max)} باشد.`);
  return result;
}
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
type Obj = Record<string, unknown>;
function object(value: unknown): Obj { requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), 'ساختار داده معتبر نیست.'); return value as Obj; }
function text(o: Obj, field: string, max: number, required = false): string {
  const value = o[field] ?? '';
  requireValue(typeof value === 'string' && value.trim().length <= max && (!required || value.trim().length > 0), `متن «${field}» کامل یا معتبر نیست.`);
  return value.trim();
}
function number(o: Obj, field: string, min: number, max: number, integer = false): number {
  const value = o[field];
  requireValue(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)), `عدد «${field}» خارج از محدوده است.`);
  return value;
}
function bool(o: Obj, field: string) { requireValue(typeof o[field] === 'boolean', `وضعیت «${field}» معتبر نیست.`); return o[field] as boolean; }
export function date(value: string): string {
  requireValue(isValidISODate(value), 'تاریخ معتبر نیست.');
  const year = jalaliParts(value).year;
  requireValue(year >= 1300 && year <= 1500, 'سال باید بین ۱۳۰۰ و ۱۵۰۰ شمسی باشد.');
  return value;
}
function dateField(o: Obj, key: string) { return date(text(o, key, 10, true)); }
function list(value: unknown, max: number): Obj[] { requireValue(Array.isArray(value) && value.length <= max, 'تعداد یا ساختار رکوردها معتبر نیست.'); return value.map(object); }
export function minutes(report: Report) { return report.subjects.reduce((sum, row) => sum + row.minutes, 0); }
export function inRange(day: string, range: Range) { return day >= range.start && day <= range.end; }
export function sessionTime(time: string, duration: number) {
  requireValue(/^([01]\d|2[0-3]):[0-5]\d$/.test(time), 'ساعت را به شکل ۱۶:۳۰ وارد کن.');
  requireValue(Number.isInteger(duration) && duration >= 5 && duration <= 600, 'مدت جلسه باید ۵ تا ۶۰۰ دقیقه باشد.');
  const [hour, minute] = time.split(':').map(Number);
  requireValue(hour * 60 + minute + duration < 1440, 'جلسه باید پیش از نیمه‌شب همان روز تمام شود.');
}
/** Validate and project every field before an atomic browser-storage replacement. Compatible with Android v1 backups. */
export function validateNotebook(input: unknown, requireProfile = false): Notebook {
  const source = object(input);
  requireValue(Object.keys(source).length === COLLECTIONS.length && COLLECTIONS.every(key => key in source), 'بخش‌های پشتیبان کامل یا سازگار نیستند.');
  const raw = Object.fromEntries(COLLECTIONS.map(key => [key, list(source[key], 10000)])) as Record<keyof Notebook, Obj[]>;
  const total = COLLECTIONS.reduce((sum, key) => sum + raw[key].length, 0);
  requireValue(total <= 20000, 'حداکثر ۲۰٬۰۰۰ رکورد قابل نگهداری است.');
  requireValue(raw.profile.length <= 1 && (!requireProfile || raw.profile.length === 1), 'پشتیبان باید دقیقاً یک پروفایل داشته باشد.');
  for (const key of COLLECTIONS) {
    const ids = new Set<string>();
    for (const row of raw[key]) {
      const id = text(row, 'id', 64, true);
      requireValue(row.id === id && /^[a-zA-Z0-9-]+$/.test(id) && !ids.has(id), 'شناسهٔ تکراری یا نامعتبر وجود دارد.'); ids.add(id);
    }
  }
  const result = emptyNotebook();
  result.profile = raw.profile.map(row => { requireValue(row.id === 'local', 'شناسهٔ پروفایل معتبر نیست.'); return { id: 'local', name: text(row, 'name', 80, true), grade: number(row, 'grade', 1, 12, true), field: text(row, 'field', 80), scale: number(row, 'scale', 1, 100), dailyGoal: number(row, 'dailyGoal', 5, 1440, true), demo: bool(row, 'demo') }; });
  const names = new Set<string>();
  result.subjects = raw.subjects.map(row => {
    const name = text(row, 'name', 80, true), color = text(row, 'color', 7, true), key = name.toLocaleLowerCase('fa');
    requireValue(!names.has(key), 'نام درس‌ها نباید تکراری باشد.'); names.add(key);
    requireValue(/^#[0-9A-Fa-f]{6}$/.test(color), 'رنگ درس معتبر نیست.');
    return { id: String(row.id), name, color, archived: bool(row, 'archived') };
  });
  const subjectIds = new Set(result.subjects.map(s => s.id));
  const subject = (row: Obj, optional = false) => { const id = text(row, 'subjectId', 64, !optional); requireValue((optional && id === '') || subjectIds.has(id), 'درس مربوط به یک رکورد در پشتیبان وجود ندارد.'); return id; };
  const totals = new Map<string, number>();
  result.reports = raw.reports.map(row => {
    const day = dateField(row, 'date'), seen = new Set<string>();
    const subjects = list(row.subjects, 40).map(r => {
      const subjectId = subject(r); requireValue(!seen.has(subjectId), 'هر درس در یک گزارش فقط یک ردیف دارد.'); seen.add(subjectId);
      return { subjectId, minutes: number(r, 'minutes', 1, 1440, true), note: text(r, 'note', 1000) };
    });
    const tasks = list(row.tasks, 50).map(r => ({ title: text(r, 'title', 200, true), subjectId: subject(r, true), completed: bool(r, 'completed') }));
    const report: Report = { id: String(row.id), date: day, subjects, tasks, lessons: text(row, 'lessons', 4000), exercises: text(row, 'exercises', 4000), difficulties: text(row, 'difficulties', 4000), reflection: text(row, 'reflection', 4000), nextGoals: text(row, 'nextGoals', 4000) };
    requireValue(subjects.length || tasks.length || report.lessons || report.exercises || report.difficulties || report.reflection || report.nextGoals, 'گزارش خالی ذخیره نمی‌شود.');
    totals.set(day, (totals.get(day) ?? 0) + minutes(report)); requireValue(totals.get(day)! <= 1440, 'جمع مطالعهٔ یک روز نباید از ۱۴۴۰ دقیقه بیشتر شود.');
    return report;
  });
  result.exams = raw.exams.map(row => {
    const maxGrade = number(row, 'maxGrade', 1, 10000);
    requireValue('grade' in row && 'weight' in row, 'نمره یا ضریب در رکورد آزمون موجود نیست.');
    return { id: String(row.id), subjectId: subject(row), title: text(row, 'title', 150, true), date: dateField(row, 'date'), maxGrade, grade: row.grade === null ? null : number(row, 'grade', 0, maxGrade), weight: row.weight === null ? null : number(row, 'weight', 0.1, 10), notes: text(row, 'notes', 4000) };
  });
  result.sessions = raw.sessions.map(row => {
    const time = text(row, 'time', 5, true), duration = number(row, 'duration', 5, 600, true), kind = text(row, 'kind', 30, true), priority = text(row, 'priority', 20, true);
    sessionTime(time, duration); requireValue(KINDS.includes(kind) && PRIORITIES.includes(priority), 'نوع یا اولویت جلسه معتبر نیست.');
    return { id: String(row.id), subjectId: subject(row, true), title: text(row, 'title', 150, true), date: dateField(row, 'date'), time, duration, completed: bool(row, 'completed'), seriesId: text(row, 'seriesId', 64), kind, priority, notes: text(row, 'notes', 4000) };
  });
  result.goals = raw.goals.map(row => {
    const metric = text(row, 'metric', 20, true), period = text(row, 'period', 20, true), start = dateField(row, 'start'), end = dateField(row, 'end');
    requireValue(['minutes', 'tasks', 'average'].includes(metric) && ['daily', 'weekly', 'monthly'].includes(period), 'نوع هدف معتبر نیست.'); requireValue(start <= end, 'پایان هدف نباید پیش از شروع باشد.');
    return { id: String(row.id), title: text(row, 'title', 150, true), metric: metric as Goal['metric'], period: period as Goal['period'], start, end, target: number(row, 'target', 1, metric === 'average' ? 100 : 100000), active: bool(row, 'active') };
  });
  requireValue(result.profile.length === 1 || total === 0, 'داده بدون پروفایل قابل نگهداری نیست.');
  return result;
}
export function parseBackup(input: string): Notebook {
  requireValue(new TextEncoder().encode(input).length <= 5_000_000, 'فایل پشتیبان باید حداکثر ۵ مگابایت باشد.');
  let root: Obj;
  try { root = object(JSON.parse(input)); } catch { throw new Error('فایل JSON معتبر نیست.'); }
  requireValue(root.app === 'daftar-setareh-offline' && root.version === 1, 'فرمت یا نسخهٔ پشتیبان سازگار نیست.');
  return validateNotebook(root.data, true);
}
export function backupText(data: Notebook) {
  const envelope = { app: 'daftar-setareh-offline', version: 1, exportedAt: new Date().toISOString(), data: validateNotebook(data, true) };
  const pretty = JSON.stringify(envelope, null, 2);
  if (new TextEncoder().encode(pretty).length <= 5_000_000) return pretty;
  const compact = JSON.stringify(envelope);
  requireValue(new TextEncoder().encode(compact).length <= 5_000_000, 'حجم دفتر از حد پشتیبان ۵ مگابایتی بیشتر است؛ یادداشت‌های طولانی را کوتاه کن.');
  return compact;
}
export function recurrence(start: string, end: string, days: number[], repeat: boolean) {
  date(start); date(end); requireValue(end >= start, 'پایان برنامه نباید پیش از شروع باشد.');
  if (!repeat) return [start];
  requireValue(diffDaysISO(start, end) <= 120, 'بازهٔ تکرار حداکثر ۱۲۰ روز است.');
  requireValue(days.length && days.every(day => Number.isInteger(day) && day >= 0 && day <= 6), 'دست‌کم یک روز هفته انتخاب کن.');
  const result: string[] = [];
  for (let day = start; day <= end; day = addDaysISO(day, 1)) if (days.includes(parseISODate(day).getDay())) result.push(day);
  requireValue(result.length, 'در این بازه روزی مطابق انتخاب وجود ندارد.'); return result;
}
export function averages(data: Notebook, range: Range) {
  return data.subjects.map(subject => {
    const exams = data.exams.filter(exam => exam.subjectId === subject.id && exam.grade !== null && inRange(exam.date, range));
    const weight = exams.reduce((sum, exam) => sum + (exam.weight ?? 1), 0);
    const percent = weight ? exams.reduce((sum, exam) => sum + exam.grade! / exam.maxGrade * 100 * (exam.weight ?? 1), 0) / weight : null;
    return { subject, percent, count: exams.length };
  });
}
export function overall(data: Notebook, range: Range): number | null {
  const values = averages(data, range).flatMap(row => row.percent === null ? [] : [row.percent]); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
export function summary(data: Notebook, range: Range) {
  const reports = data.reports.filter(r => inRange(r.date, range)), sessions = data.sessions.filter(s => inRange(s.date, range));
  return { minutes: reports.reduce((sum, r) => sum + minutes(r), 0), tasks: reports.reduce((sum, r) => sum + r.tasks.filter(t => t.completed).length, 0), pendingTasks: reports.reduce((sum, r) => sum + r.tasks.filter(t => !t.completed).length, 0), days: new Set(reports.map(r => r.date)).size, sessions: sessions.length, completed: sessions.filter(s => s.completed).length, plannedMinutes: sessions.reduce((sum, s) => sum + s.duration, 0), average: overall(data, range), graded: data.exams.filter(e => e.grade !== null && inRange(e.date, range)).length, pending: data.exams.filter(e => e.grade === null && inRange(e.date, range)).length };
}
export function goalProgress(data: Notebook, goal: Goal, today = todayISO()) {
  const period = goal.period === 'daily' ? { start: today, end: today } : goal.period === 'weekly' ? weekRange(today) : monthRange(today);
  const range = { start: goal.start > period.start ? goal.start : period.start, end: goal.end < period.end ? goal.end : period.end };
  const s = range.start <= range.end ? summary(data, range) : null;
  const current = s ? (goal.metric === 'minutes' ? s.minutes : goal.metric === 'tasks' ? s.tasks : s.average) : null;
  return { current, percent: current === null ? 0 : Math.min(100, current / goal.target * 100), upcoming: today < goal.start, ended: today > goal.end };
}
export function defaultNotebook(name: string, grade: number, field: string, dailyGoal: number): Notebook {
  const names = grade <= 6 ? ['فارسی', 'ریاضی', 'علوم', 'مطالعات اجتماعی'] : grade <= 9 ? ['ریاضی', 'علوم تجربی', 'فارسی', 'زبان انگلیسی', 'عربی'] : field === 'ریاضی' ? ['حسابان', 'هندسه', 'فیزیک', 'شیمی', 'فارسی', 'زبان انگلیسی'] : field === 'انسانی' ? ['ادبیات فارسی', 'تاریخ', 'جغرافیا', 'جامعه‌شناسی', 'ریاضی'] : field === 'فنی و حرفه‌ای' ? ['دانش فنی پایه', 'ریاضی', 'کارگاه تخصصی', 'فارسی'] : ['زیست‌شناسی', 'ریاضی', 'فیزیک', 'شیمی', 'فارسی', 'زبان انگلیسی'];
  return validateNotebook({ ...emptyNotebook(), profile: [{ id: 'local', name, grade, field, dailyGoal, scale: 20, demo: false }], subjects: names.map((name, index) => ({ id: uid(), name, color: COLORS[index % COLORS.length], archived: false })) }, true);
}
