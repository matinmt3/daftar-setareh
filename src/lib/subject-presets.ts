import type { StudyFieldValue } from "./constants";

export type SubjectPreset = {
  name: string;
  color: string;
  icon: string;
};

const elementaryLower: SubjectPreset[] = [
  { name: "فارسی", color: "coral", icon: "book-open" },
  { name: "ریاضی", color: "violet", icon: "calculator" },
  { name: "علوم", color: "teal", icon: "atom" },
  { name: "قرآن و هدیه‌های آسمان", color: "gold", icon: "book-open" },
  { name: "هنر", color: "orange", icon: "palette" },
  { name: "تربیت بدنی", color: "green", icon: "dumbbell" },
];

const elementaryUpper: SubjectPreset[] = [
  ...elementaryLower,
  { name: "مطالعات اجتماعی", color: "indigo", icon: "globe2" },
  { name: "زبان انگلیسی", color: "sky", icon: "languages" },
];

const middleSchool: SubjectPreset[] = [
  { name: "فارسی", color: "coral", icon: "book-open" },
  { name: "ریاضی", color: "violet", icon: "calculator" },
  { name: "علوم تجربی", color: "teal", icon: "flask" },
  { name: "مطالعات اجتماعی", color: "indigo", icon: "globe2" },
  { name: "عربی", color: "gold", icon: "book-open" },
  { name: "زبان انگلیسی", color: "sky", icon: "languages" },
  { name: "پیام‌های آسمان", color: "plum", icon: "book-open" },
  { name: "فرهنگ و هنر", color: "orange", icon: "palette" },
  { name: "کار و فناوری", color: "slate", icon: "code" },
  { name: "تربیت بدنی", color: "green", icon: "dumbbell" },
];

const commonHigh: SubjectPreset[] = [
  { name: "فارسی", color: "coral", icon: "book-open" },
  { name: "عربی", color: "gold", icon: "book-open" },
  { name: "زبان انگلیسی", color: "sky", icon: "languages" },
  { name: "دین و زندگی", color: "plum", icon: "book-open" },
  { name: "تربیت بدنی", color: "green", icon: "dumbbell" },
];

const highSchoolByField: Record<StudyFieldValue, SubjectPreset[]> = {
  math: [
    ...commonHigh,
    { name: "ریاضی", color: "violet", icon: "calculator" },
    { name: "هندسه", color: "indigo", icon: "calculator" },
    { name: "حسابان", color: "violet", icon: "calculator" },
    { name: "فیزیک", color: "teal", icon: "atom" },
    { name: "شیمی", color: "green", icon: "flask" },
  ],
  science: [
    ...commonHigh,
    { name: "ریاضی", color: "violet", icon: "calculator" },
    { name: "زیست‌شناسی", color: "green", icon: "leaf" },
    { name: "شیمی", color: "teal", icon: "flask" },
    { name: "فیزیک", color: "indigo", icon: "atom" },
    { name: "زمین‌شناسی", color: "gold", icon: "globe2" },
  ],
  humanities: [
    ...commonHigh,
    { name: "ادبیات فارسی", color: "coral", icon: "book-open" },
    { name: "تاریخ", color: "orange", icon: "landmark" },
    { name: "جغرافیا", color: "teal", icon: "globe2" },
    { name: "جامعه‌شناسی", color: "indigo", icon: "book-open" },
    { name: "منطق و فلسفه", color: "plum", icon: "book-open" },
    { name: "ریاضی", color: "violet", icon: "calculator" },
  ],
  vocational: [
    ...commonHigh,
    { name: "ریاضی", color: "violet", icon: "calculator" },
    { name: "دانش فنی پایه", color: "slate", icon: "code" },
    { name: "نقشه‌کشی", color: "sky", icon: "book-open" },
    { name: "کارگاه تخصصی", color: "orange", icon: "code" },
  ],
};

export function defaultSubjectsFor(grade: number, field: StudyFieldValue | null): SubjectPreset[] {
  if (grade <= 3) return elementaryLower;
  if (grade <= 6) return elementaryUpper;
  if (grade <= 9) return middleSchool;
  return highSchoolByField[field ?? "science"];
}
