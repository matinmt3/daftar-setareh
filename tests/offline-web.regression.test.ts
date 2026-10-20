import { afterEach, describe, expect, it, vi } from 'vitest';
import { averages, backupText, emptyNotebook, numeric, overall, parseBackup, recurrence, sessionTime, validateNotebook, type Notebook } from '../web-offline/core';
import { readNotebook, STORAGE_KEY, writeNotebook } from '../web-offline/store';

function notebook(): Notebook {
  return {
    ...emptyNotebook(),
    profile: [{ id: 'local', name: 'دانش‌آموز آزمون', grade: 9, field: '', scale: 20, dailyGoal: 60, demo: false }],
    subjects: [{ id: 'math', name: 'ریاضی', color: '#0F766E', archived: false }, { id: 'science', name: 'علوم', color: '#1D4ED8', archived: false }],
  };
}
function study(id: string, minutes: number) {
  return { id, date: '2026-10-20', subjects: [{ subjectId: 'math', minutes, note: '' }], tasks: [], lessons: '', exercises: '', difficulties: '', reflection: '', nextGoals: '' };
}
function storage(initial: string | null) {
  let value = initial;
  const memory = { getItem: vi.fn((key: string) => key === STORAGE_KEY ? value : null), setItem: vi.fn((_key: string, next: string) => { value = next; }) };
  vi.stubGlobal('localStorage', memory);
  return { memory, current: () => value };
}
afterEach(() => vi.unstubAllGlobals());

describe('independent web input and calculation regressions', () => {
  it('accepts Persian and Arabic numerals without stripping signs or decimals', () => {
    expect(numeric('۳۰', 0, 1440, 'زمان', true)).toBe(30);
    expect(numeric('٣٠', 0, 1440, 'زمان', true)).toBe(30);
    expect(numeric('۱۸٫۵', 0, 20, 'نمره')).toBe(18.5);
    expect(() => numeric('-30', 0, 1440, 'زمان', true)).toThrow();
    expect(() => numeric('1.5', 0, 1440, 'زمان', true)).toThrow();
    expect(() => numeric('', 0, 1440, 'زمان', true)).toThrow();
  });
  it('includes a zero grade and default weight while ignoring an ungraded exam', () => {
    const data = notebook();
    data.exams = [
      { id: 'zero', subjectId: 'math', title: 'صفر', date: '2026-10-20', grade: 0, maxGrade: 20, weight: 1, notes: '' },
      { id: 'full', subjectId: 'math', title: 'کامل', date: '2026-10-20', grade: 20, maxGrade: 20, weight: 3, notes: '' },
      { id: 'pending', subjectId: 'math', title: 'بدون نمره', date: '2026-10-20', grade: null, maxGrade: 20, weight: 10, notes: '' },
      { id: 'other', subjectId: 'science', title: 'نیم', date: '2026-10-20', grade: 10, maxGrade: 20, weight: null, notes: '' },
    ];
    const range = { start: '2026-10-01', end: '2026-10-31' };
    expect(averages(data, range).find(r => r.subject.id === 'math')?.percent).toBe(75);
    expect(overall(data, range)).toBe(62.5);
    expect(overall(data, { start: '2026-11-01', end: '2026-11-30' })).toBeNull();
  });
  it('rejects an invalid calendar date instead of normalizing it into another month', () => {
    const data = notebook(); data.reports = [{ ...study('invalid-date', 30), date: '2026-02-30' }];
    expect(() => validateNotebook(data)).toThrow(/تاریخ/);
  });
  it('caps combined reports for one day while permitting a full valid day', () => {
    const data = notebook(); data.reports = [study('first', 1000), study('second', 440)];
    expect(validateNotebook(data).reports).toHaveLength(2);
    data.reports[1].subjects[0].minutes = 441;
    expect(() => validateNotebook(data)).toThrow(/۱۴۴۰/);
  });
  it('rejects negative or fractional persisted minutes', () => {
    for (const minutes of [-30, 1.5]) {
      const data = notebook(); data.reports = [study('invalid-minutes', minutes)];
      expect(() => validateNotebook(data)).toThrow();
    }
  });
  it('rejects dangling subject references and duplicate record identifiers', () => {
    const data = notebook(); data.reports = [study('same', 10), study('same', 10)];
    expect(() => validateNotebook(data)).toThrow(/شناسه/);
    data.reports = [study('valid-id', 10)]; data.reports[0].subjects[0].subjectId = 'missing';
    expect(() => validateNotebook(data)).toThrow(/درس/);
  });
  it('rejects whitespace-padded identifiers before accepting a broken notebook', () => {
    const data = notebook(); data.subjects[0].id = ' math ';
    expect(() => validateNotebook(data)).toThrow(/شناسه/);
    const reportData = notebook(); reportData.reports = [study(' report-one ', 10)];
    expect(() => validateNotebook(reportData)).toThrow(/شناسه/);
  });
  it('bounds recurring dates and requires at least one matching weekday', () => {
    expect(recurrence('2026-10-20', '2026-10-27', [2], true)).toEqual(['2026-10-20', '2026-10-27']);
    expect(() => recurrence('2026-10-20', '2027-04-20', [2], true)).toThrow(/۱۲۰/);
    expect(() => recurrence('2026-10-20', '2026-10-20', [1], true)).toThrow();
    expect(() => recurrence('2026-10-20', '2026-10-27', [], true)).toThrow();
  });
  it('rejects invalid clocks and a session crossing midnight', () => {
    expect(() => sessionTime('16:30', 60)).not.toThrow();
    expect(() => sessionTime('25:00', 30)).toThrow();
    expect(() => sessionTime('23:30', 60)).toThrow();
  });
});

describe('backup and persistence safety', () => {
  it('round trips all stored data through the versioned Android-compatible envelope', () => {
    const data = notebook(); data.reports = [study('report-one', 45)];
    const text = backupText(data);
    expect(JSON.parse(text).app).toBe('daftar-setareh-offline');
    expect(parseBackup(text)).toEqual(data);
  });
  it('preserves fractional goal targets already accepted by Android schema version one', () => {
    const data = notebook();
    data.goals = [{ id: 'legacy-fraction', title: 'هدف نسخهٔ قبلی', metric: 'tasks', period: 'weekly', target: 4.5, start: '2026-10-01', end: '2026-10-31', active: true }];
    expect(validateNotebook(data).goals[0].target).toBe(4.5);
    expect(parseBackup(backupText(data))).toEqual(data);
  });
  it('rejects unsupported versions, truncated JSON and an absent profile', () => {
    const data = notebook();
    expect(() => parseBackup(JSON.stringify({ app: 'daftar-setareh-offline', version: 2, data }))).toThrow();
    expect(() => parseBackup('{"app":')).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'daftar-setareh-offline', version: 1, data: emptyNotebook() }))).toThrow();
  });
  it('checks the backup size in UTF-8 bytes before parsing', () => {
    expect(() => parseBackup('ا'.repeat(2_500_001))).toThrow(/۵ مگابایت/);
  });
  it('retains corrupted raw storage for recovery instead of overwriting it', () => {
    const { memory, current } = storage('{invalid');
    const read = readNotebook();
    expect(read.error).toBeTruthy();
    expect(read.raw).toBe('{invalid');
    expect(current()).toBe('{invalid');
    expect(memory.setItem).not.toHaveBeenCalled();
  });
  it('leaves existing bytes intact when storage quota blocks a write', () => {
    const original = JSON.stringify(notebook());
    const { memory, current } = storage(original);
    memory.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    const next = notebook(); next.profile[0].name = 'نام ویرایش‌شده';
    expect(() => writeNotebook(next, original)).toThrow(/ذخیره نشد/);
    expect(current()).toBe(original);
  });
  it('refuses to replace newer changes from another tab', () => {
    const old = JSON.stringify(notebook()); const newer = notebook(); newer.profile[0].name = 'نام تب دیگر';
    const { current } = storage(JSON.stringify(newer));
    expect(() => writeNotebook(notebook(), old)).toThrow(/تب دیگری/);
    expect(JSON.parse(current()!).profile[0].name).toBe('نام تب دیگر');
  });
  it('validates before writing and publishes only bytes actually saved', () => {
    const { memory, current } = storage(null);
    const invalid = notebook(); invalid.profile[0].dailyGoal = -30;
    expect(() => writeNotebook(invalid, null)).toThrow();
    expect(memory.setItem).not.toHaveBeenCalled();
    const saved = writeNotebook(notebook(), null);
    expect(saved.raw).toBe(current());
    expect(saved.data).toEqual(notebook());
  });
});
