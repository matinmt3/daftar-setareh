export const APP_NAME = "دفتر ستاره";
export const APP_TAGLINE = "هر روز یک صفحهٔ تازه، هر صفحه یک ستاره";
export const APP_DESCRIPTION =
  "دفتر ستاره، همراه روزهای درسی دانش‌آموزهاست؛ گزارش روزانه، برنامهٔ مطالعه، آزمون‌ها، معدل دقیق و کارنامهٔ خودکار در یک جای ساده و دوست‌داشتنی.";

export const TEHRAN_TIMEZONE = "Asia/Tehran";

export const GRADE_LEVELS = [
  { value: 1, label: "پایهٔ اول", band: "ابتدایی" },
  { value: 2, label: "پایهٔ دوم", band: "ابتدایی" },
  { value: 3, label: "پایهٔ سوم", band: "ابتدایی" },
  { value: 4, label: "پایهٔ چهارم", band: "ابتدایی" },
  { value: 5, label: "پایهٔ پنجم", band: "ابتدایی" },
  { value: 6, label: "پایهٔ ششم", band: "ابتدایی" },
  { value: 7, label: "پایهٔ هفتم", band: "متوسطهٔ اول" },
  { value: 8, label: "پایهٔ هشتم", band: "متوسطهٔ اول" },
  { value: 9, label: "پایهٔ نهم", band: "متوسطهٔ اول" },
  { value: 10, label: "پایهٔ دهم", band: "متوسطهٔ دوم" },
  { value: 11, label: "پایهٔ یازدهم", band: "متوسطهٔ دوم" },
  { value: 12, label: "پایهٔ دوازدهم", band: "متوسطهٔ دوم" },
] as const;

export function gradeLabel(grade: number | null | undefined): string {
  if (!grade) return "پایه نامشخص";
  return GRADE_LEVELS.find((item) => item.value === grade)?.label ?? "پایه نامشخص";
}

export function gradeBand(grade: number | null | undefined): "ابتدایی" | "متوسطهٔ اول" | "متوسطهٔ دوم" {
  if (!grade || grade <= 6) return "ابتدایی";
  if (grade <= 9) return "متوسطهٔ اول";
  return "متوسطهٔ دوم";
}

export const STUDY_FIELDS = [
  { value: "math", label: "ریاضی و فیزیک" },
  { value: "science", label: "علوم تجربی" },
  { value: "humanities", label: "علوم انسانی" },
  { value: "vocational", label: "فنی و حرفه‌ای" },
] as const;

export type StudyFieldValue = (typeof STUDY_FIELDS)[number]["value"];

export function fieldLabel(field: string | null | undefined): string {
  return STUDY_FIELDS.find((item) => item.value === field)?.label ?? "";
}

export const SUBJECT_COLORS = [
  { value: "violet", label: "بنفش", hex: "#6C5CE7", soft: "#EEEBFF" },
  { value: "sky", label: "آبی", hex: "#2E9BEA", soft: "#E7F4FF" },
  { value: "teal", label: "فیروزه‌ای", hex: "#13B5A6", soft: "#E4FAF6" },
  { value: "green", label: "سبز", hex: "#3DBE72", soft: "#E8FAEE" },
  { value: "orange", label: "نارنجی", hex: "#F28C3A", soft: "#FFF1E3" },
  { value: "coral", label: "صورتی", hex: "#F06E86", soft: "#FFEDF1" },
  { value: "gold", label: "طلایی", hex: "#D9A21B", soft: "#FFF6DA" },
  { value: "indigo", label: "نیلی", hex: "#4A5AC9", soft: "#EBEEFF" },
  { value: "plum", label: "آلویی", hex: "#A04F9E", soft: "#FAEBF9" },
  { value: "slate", label: "خاکستری", hex: "#5C6B82", soft: "#EEF2F7" },
] as const;

export type SubjectColorValue = (typeof SUBJECT_COLORS)[number]["value"];

export function subjectColor(color: string | null | undefined) {
  return SUBJECT_COLORS.find((item) => item.value === color) ?? SUBJECT_COLORS[0];
}

export const SUBJECT_ICONS = [
  { value: "book-open", label: "کتاب" },
  { value: "calculator", label: "ریاضی" },
  { value: "flask", label: "آزمایشگاه" },
  { value: "globe2", label: "جغرافیا" },
  { value: "languages", label: "زبان" },
  { value: "atom", label: "علوم" },
  { value: "palette", label: "هنر" },
  { value: "dumbbell", label: "ورزش" },
  { value: "landmark", label: "تاریخ" },
  { value: "leaf", label: "طبیعت" },
  { value: "music", label: "موسیقی" },
  { value: "code", label: "رایانه" },
] as const;

export type SubjectIconValue = (typeof SUBJECT_ICONS)[number]["value"];

export const WEEKDAYS = [
  { value: 6, label: "شنبه", short: "ش" },
  { value: 0, label: "یکشنبه", short: "ی" },
  { value: 1, label: "دوشنبه", short: "د" },
  { value: 2, label: "سه‌شنبه", short: "س" },
  { value: 3, label: "چهارشنبه", short: "چ" },
  { value: 4, label: "پنجشنبه", short: "پ" },
  { value: 5, label: "جمعه", short: "ج" },
] as const;

export const SESSION_KINDS = [
  { value: "study", label: "مطالعه", icon: "book-open" },
  { value: "homework", label: "تکلیف", icon: "pencil" },
  { value: "revision", label: "مرور", icon: "rotate-ccw" },
  { value: "exam-prep", label: "آماده‌سازی آزمون", icon: "target" },
  { value: "project", label: "پروژه", icon: "folder" },
] as const;

export type SessionKind = (typeof SESSION_KINDS)[number]["value"];

export function sessionKindLabel(kind: string): string {
  return SESSION_KINDS.find((item) => item.value === kind)?.label ?? "مطالعه";
}

export const PRIORITIES = [
  { value: "low", label: "عادی", color: "mint" },
  { value: "medium", label: "مهم", color: "gold" },
  { value: "high", label: "خیلی مهم", color: "coral" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["value"];

export function priorityLabel(priority: string): string {
  return PRIORITIES.find((item) => item.value === priority)?.label ?? "عادی";
}

export const GOAL_METRICS = [
  { value: "study-minutes", label: "دقیقه مطالعه", unit: "دقیقه" },
  { value: "tasks-completed", label: "کار انجام‌شده", unit: "کار" },
  { value: "exam-average", label: "میانگین آزمون‌ها", unit: "درصد" },
] as const;

export type GoalMetric = (typeof GOAL_METRICS)[number]["value"];

export function goalMetricLabel(metric: string): string {
  return GOAL_METRICS.find((item) => item.value === metric)?.label ?? "هدف";
}

export const GOAL_PERIODS = [
  { value: "daily", label: "روزانه" },
  { value: "weekly", label: "هفتگی" },
  { value: "monthly", label: "ماهانه" },
] as const;

export type GoalPeriod = (typeof GOAL_PERIODS)[number]["value"];

export function goalPeriodLabel(period: string): string {
  return GOAL_PERIODS.find((item) => item.value === period)?.label ?? "";
}

export const REPORT_ENTRY_TITLES = ["گزارش اصلی", "گزارش تکمیلی"];

export function reportEntryTitle(index: number): string {
  if (index === 0) return "گزارش اصلی";
  return `گزارش تکمیلی ${new Intl.NumberFormat("fa-IR").format(index)}`;
}

export const MAX_EXAM_WEIGHT = 10;
export const MIN_EXAM_WEIGHT = 0.1;

export const DEFAULT_GRADE_SCALE = 20;
export const DEFAULT_DAILY_GOAL = 90;
