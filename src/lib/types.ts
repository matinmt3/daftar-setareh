import type { GoalMetric, GoalPeriod, Priority, SessionKind, StudyFieldValue } from "./constants";

export type User = {
  id: string;
  phone: string;
  name: string | null;
  gradeLevel: number | null;
  field: StudyFieldValue | null;
  gradeScale: number;
  dailyGoalMinutes: number;
  onboardedAt: string | null;
  isDemo: boolean;
  notificationEnabled: boolean;
  reminderLeadMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

export type Subject = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Exam = {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  examDate: string;
  grade: number | null;
  maxGrade: number;
  weight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExamWithSubject = Exam & {
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
};

export type ReportSubject = {
  id: string;
  reportId: string;
  subjectId: string;
  minutes: number;
  note: string | null;
  subjectName?: string;
  subjectColor?: string;
  subjectIcon?: string;
};

export type ReportTaskStatus = "completed" | "pending";

export type ReportTask = {
  id: string;
  reportId: string;
  subjectId: string | null;
  title: string;
  status: ReportTaskStatus;
  createdAt: string;
  subjectName?: string | null;
};

export type DailyReport = {
  id: string;
  userId: string;
  reportDate: string;
  entryIndex: number;
  lessonsReviewed: string | null;
  exercises: string | null;
  difficulties: string | null;
  reflection: string | null;
  nextDayGoals: string | null;
  createdAt: string;
  updatedAt: string;
  subjects: ReportSubject[];
  tasks: ReportTask[];
};

export type DailyReportSummary = {
  id: string;
  userId: string;
  reportDate: string;
  entryIndex: number;
  minutes: number;
  completedTasks: number;
  pendingTasks: number;
  reflection: string | null;
  nextDayGoals: string | null;
  subjectCount: number;
  updatedAt: string;
};

export type StudySessionStatus = "planned" | "completed";

export type StudySeries = {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  kind: SessionKind;
  priority: Priority;
  notes: string | null;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  reminderMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type StudySession = {
  id: string;
  userId: string;
  subjectId: string | null;
  seriesId: string | null;
  title: string;
  kind: SessionKind;
  priority: Priority;
  notes: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: StudySessionStatus;
  reminderMinutes: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subjectName?: string | null;
  subjectColor?: string | null;
  subjectIcon?: string | null;
  seriesWeekdays?: number[];
};

export type StudyGoal = {
  id: string;
  userId: string;
  title: string;
  metric: GoalMetric;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GoalProgress = {
  goal: StudyGoal;
  currentValue: number;
  targetValue: number;
  percent: number;
  achieved: boolean;
  label: string;
};

export type ReportCardType = "weekly" | "monthly";

export type SubjectPeriodStats = {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  examCount: number;
  averagePercent: number;
  scaleValue: number;
  highestPercent: number;
  lowestPercent: number;
  latestPercent: number | null;
  latestDate: string | null;
  weighted: boolean;
  allTimePercent: number | null;
  allTimeScaleValue: number | null;
  changeFromPrevious: number | null;
};

export type ExamPeriodEntry = {
  id: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  examDate: string;
  grade: number;
  maxGrade: number;
  percent: number;
  scaleValue: number;
};

export type GradeDistributionBucket = {
  label: string;
  count: number;
  min: number;
  max: number;
};

export type ReportCardGoal = {
  id: string;
  title: string;
  metric: GoalMetric;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  percent: number;
  achieved: boolean;
};

export type ReportCardData = {
  type: ReportCardType;
  periodStart: string;
  periodEnd: string;
  title: string;
  periodLabel: string;
  generatedAt: string;
  gradeScale: number;
  overallPercent: number | null;
  overallScale: number | null;
  allTimePercent: number | null;
  allTimeScale: number | null;
  allTimeExamCount: number;
  examCount: number;
  gradedExamCount: number;
  pendingExamCount: number;
  subjectStats: SubjectPeriodStats[];
  exams: ExamPeriodEntry[];
  highestExam: ExamPeriodEntry | null;
  lowestExam: ExamPeriodEntry | null;
  studyMinutes: number;
  studyChangeMinutes: number | null;
  plannedMinutes: number;
  planCompletion: number | null;
  completedSessions: number;
  totalSessions: number;
  tasksCompleted: number;
  tasksPending: number;
  reportDays: number;
  previous: {
    periodStart: string;
    periodEnd: string;
    overallPercent: number | null;
    studyMinutes: number;
    planCompletion: number | null;
    tasksCompleted: number;
  } | null;
  overallChange: number | null;
  studyChange: number | null;
  taskChange: number | null;
  strengths: string[];
  needsAttention: string[];
  summaryLines: string[];
  goals: ReportCardGoal[];
  gradeDistribution: GradeDistributionBucket[];
  hasAcademicData: boolean;
  hasStudyData: boolean;
  hasEnoughForComparison: boolean;
};

export type ReportCardRecord = {
  id: string;
  userId: string;
  type: ReportCardType;
  periodStart: string;
  periodEnd: string;
  data: ReportCardData;
  fingerprint: string;
  generatedAt: string;
};

export type DashboardData = {
  user: User;
  today: string;
  weeklyRange: { start: string; end: string };
  monthlyRange: { start: string; end: string };
  todayMinutes: number;
  todayCompletedTasks: number;
  todayPendingTasks: number;
  todayReports: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  weekStudyByDay: { date: string; minutes: number; plannedMinutes: number }[];
  streak: number;
  overallPercent: number | null;
  overallScale: number | null;
  subjectAverages: SubjectPeriodStats[];
  recentExams: ExamWithSubject[];
  upcomingExams: ExamWithSubject[];
  todaySessions: StudySession[];
  upcomingSessions: StudySession[];
  activeGoals: GoalProgress[];
  weeklyAcademicChange: number | null;
  monthlyAcademicChange: number | null;
  planCompletion: number | null;
  reportToday: boolean;
  latestReportId: string | null;
};

export type AnalyticsData = {
  range: { start: string; end: string };
  scale: number;
  overallPercent: number | null;
  overallScale: number | null;
  previousOverallPercent: number | null;
  previousOverallChange: number | null;
  examCount: number;
  gradedExamCount: number;
  studyMinutes: number;
  previousStudyMinutes: number | null;
  completionRate: number | null;
  completedSessions: number;
  totalSessions: number;
  streak: number;
  subjectStats: SubjectPeriodStats[];
  examTrend: {
    date: string;
    percent: number;
    title: string;
    subjectName: string;
    subjectColor: string;
    grade: number;
    maxGrade: number;
  }[];
  weeklyStudy: { label: string; start: string; minutes: number; plannedMinutes: number }[];
  monthlyStudy: { label: string; start: string; minutes: number }[];
  gradeDistribution: GradeDistributionBucket[];
  goals: GoalProgress[];
  periodComparison: {
    label: string;
    current: number | null;
    previous: number | null;
    unit: "percent" | "minutes" | "count";
  }[];
  taskCompleted: number;
  taskPending: number;
  dataWarnings: string[];
};

export type SerializedActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
