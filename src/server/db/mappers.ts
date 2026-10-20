import type {
  DailyReport,
  DailyReportSummary,
  Exam,
  ExamWithSubject,
  ReportCardData,
  ReportCardRecord,
  ReportCardType,
  ReportSubject,
  ReportTask,
  SessionRecord,
  StudyGoal,
  StudySeries,
  StudySession,
  Subject,
  User,
} from "@/lib/types";
import type {
  GoalMetric,
  GoalPeriod,
  Priority,
  SessionKind,
  StudyFieldValue,
} from "@/lib/constants";
import { toBoolean } from "./connection";

export type UserRow = {
  id: string;
  phone: string;
  name: string | null;
  grade_level: number | null;
  field: string | null;
  grade_scale: number;
  daily_goal_minutes: number;
  onboarded_at: string | null;
  is_demo: number;
  notification_enabled: number;
  reminder_lead_minutes: number;
  created_at: string;
  updated_at: string;
};

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    gradeLevel: row.grade_level,
    field: (row.field as StudyFieldValue | null) ?? null,
    gradeScale: row.grade_scale,
    dailyGoalMinutes: row.daily_goal_minutes,
    onboardedAt: row.onboarded_at,
    isDemo: toBoolean(row.is_demo),
    notificationEnabled: toBoolean(row.notification_enabled),
    reminderLeadMinutes: row.reminder_lead_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
};

export function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
  };
}

export type SubjectRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

export function mapSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isArchived: toBoolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ExamRow = {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  grade: number | null;
  max_grade: number;
  weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  subject_color?: string;
  subject_icon?: string;
};

export function mapExam(row: ExamRow): Exam {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    title: row.title,
    examDate: row.exam_date,
    grade: row.grade,
    maxGrade: row.max_grade,
    weight: row.weight,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExamWithSubject(row: ExamRow): ExamWithSubject {
  return {
    ...mapExam(row),
    subjectName: row.subject_name ?? "درس",
    subjectColor: row.subject_color ?? "violet",
    subjectIcon: row.subject_icon ?? "book-open",
  };
}

export type ReportSubjectRow = {
  id: string;
  report_id: string;
  subject_id: string;
  minutes: number;
  note: string | null;
  subject_name?: string;
  subject_color?: string;
  subject_icon?: string;
};

export function mapReportSubject(row: ReportSubjectRow): ReportSubject {
  return {
    id: row.id,
    reportId: row.report_id,
    subjectId: row.subject_id,
    minutes: row.minutes,
    note: row.note,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    subjectIcon: row.subject_icon,
  };
}

export type ReportTaskRow = {
  id: string;
  report_id: string;
  subject_id: string | null;
  title: string;
  status: string;
  created_at: string;
  subject_name?: string | null;
};

export function mapReportTask(row: ReportTaskRow): ReportTask {
  return {
    id: row.id,
    reportId: row.report_id,
    subjectId: row.subject_id,
    title: row.title,
    status: row.status === "completed" ? "completed" : "pending",
    createdAt: row.created_at,
    subjectName: row.subject_name ?? null,
  };
}

export type DailyReportRow = {
  id: string;
  user_id: string;
  report_date: string;
  entry_index: number;
  lessons_reviewed: string | null;
  exercises: string | null;
  difficulties: string | null;
  reflection: string | null;
  next_day_goals: string | null;
  created_at: string;
  updated_at: string;
};

export function mapDailyReport(row: DailyReportRow, subjects: ReportSubject[] = [], tasks: ReportTask[] = []): DailyReport {
  return {
    id: row.id,
    userId: row.user_id,
    reportDate: row.report_date,
    entryIndex: row.entry_index,
    lessonsReviewed: row.lessons_reviewed,
    exercises: row.exercises,
    difficulties: row.difficulties,
    reflection: row.reflection,
    nextDayGoals: row.next_day_goals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subjects,
    tasks,
  };
}

export type DailyReportSummaryRow = {
  id: string;
  user_id: string;
  report_date: string;
  entry_index: number;
  reflection: string | null;
  next_day_goals: string | null;
  updated_at: string;
  minutes: number | null;
  completed_tasks: number | null;
  pending_tasks: number | null;
  subject_count: number | null;
};

export function mapDailyReportSummary(row: DailyReportSummaryRow): DailyReportSummary {
  return {
    id: row.id,
    userId: row.user_id,
    reportDate: row.report_date,
    entryIndex: row.entry_index,
    reflection: row.reflection,
    nextDayGoals: row.next_day_goals,
    updatedAt: row.updated_at,
    minutes: row.minutes ?? 0,
    completedTasks: row.completed_tasks ?? 0,
    pendingTasks: row.pending_tasks ?? 0,
    subjectCount: row.subject_count ?? 0,
  };
}

export type StudySeriesRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string | null;
  start_date: string;
  end_date: string;
  weekdays: string;
  start_time: string;
  duration_minutes: number;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
};

export function mapStudySeries(row: StudySeriesRow): StudySeries {
  let weekdays: number[] = [];
  try {
    const parsed = JSON.parse(row.weekdays) as unknown;
    if (Array.isArray(parsed)) weekdays = parsed.filter((day): day is number => typeof day === "number");
  } catch {
    weekdays = [];
  }
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    title: row.title,
    kind: row.kind as SessionKind,
    priority: row.priority as Priority,
    notes: row.notes,
    startDate: row.start_date,
    endDate: row.end_date,
    weekdays,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    reminderMinutes: row.reminder_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type StudySessionRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  series_id: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  reminder_minutes: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subject_name?: string | null;
  subject_color?: string | null;
  subject_icon?: string | null;
  series_weekdays?: string | null;
};

export function mapStudySession(row: StudySessionRow): StudySession {
  let seriesWeekdays: number[] | undefined;
  if (row.series_weekdays) {
    try {
      const parsed = JSON.parse(row.series_weekdays) as unknown;
      if (Array.isArray(parsed)) {
        seriesWeekdays = parsed.filter((day): day is number => typeof day === "number");
      }
    } catch {
      seriesWeekdays = undefined;
    }
  }
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    seriesId: row.series_id,
    title: row.title,
    kind: row.kind as SessionKind,
    priority: row.priority as Priority,
    notes: row.notes,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    status: row.status === "completed" ? "completed" : "planned",
    reminderMinutes: row.reminder_minutes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subjectName: row.subject_name ?? null,
    subjectColor: row.subject_color ?? null,
    subjectIcon: row.subject_icon ?? null,
    seriesWeekdays,
  };
}

export type StudyGoalRow = {
  id: string;
  user_id: string;
  title: string;
  metric: string;
  period: string;
  target_value: number;
  start_date: string;
  end_date: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function mapStudyGoal(row: StudyGoalRow): StudyGoal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    metric: row.metric as GoalMetric,
    period: row.period as GoalPeriod,
    targetValue: row.target_value,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: toBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ReportCardRow = {
  id: string;
  user_id: string;
  card_type: string;
  period_start: string;
  period_end: string;
  data_json: string;
  fingerprint: string;
  generated_at: string;
};

export function mapReportCard(row: ReportCardRow): ReportCardRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.card_type as ReportCardType,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    data: JSON.parse(row.data_json) as ReportCardData,
    fingerprint: row.fingerprint,
    generatedAt: row.generated_at,
  };
}
