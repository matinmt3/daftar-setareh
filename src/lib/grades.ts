import type {
  Exam,
  ExamPeriodEntry,
  GradeDistributionBucket,
  Subject,
  SubjectPeriodStats,
} from "./types";
import { scaleValue } from "./format";

export type TrendDirection = "up" | "down" | "stable" | "insufficient";

export type ExamGrade = {
  exam: Exam;
  percent: number;
};

export function examPercent(exam: Pick<Exam, "grade" | "maxGrade">): number | null {
  if (exam.grade === null || exam.grade === undefined) return null;
  if (!Number.isFinite(exam.grade) || !Number.isFinite(exam.maxGrade) || exam.maxGrade <= 0) {
    return null;
  }
  if (exam.grade < 0 || exam.grade > exam.maxGrade) return null;
  return (exam.grade / exam.maxGrade) * 100;
}

export function gradedExams<T extends Pick<Exam, "grade" | "maxGrade">>(exams: T[]): (T & { percent: number })[] {
  return exams.flatMap((exam) => {
    const percent = examPercent(exam);
    return percent === null ? [] : [{ ...exam, percent }];
  });
}

export function weightedAverage(
  entries: { percent: number; weight: number | null }[],
): number | null {
  if (entries.length === 0) return null;
  const totalWeight = entries.reduce((sum, entry) => sum + (entry.weight ?? 1), 0);
  if (totalWeight <= 0) return null;
  const total = entries.reduce((sum, entry) => sum + entry.percent * (entry.weight ?? 1), 0);
  return total / totalWeight;
}

export function simpleAverage(entries: { percent: number }[]): number | null {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => sum + entry.percent, 0) / entries.length;
}

export function subjectAverage(
  exams: Pick<Exam, "grade" | "maxGrade" | "weight">[],
): { percent: number | null; weighted: boolean; count: number } {
  const valid = gradedExams(exams);
  if (valid.length === 0) return { percent: null, weighted: false, count: 0 };
  const weighted = valid.some((exam) => exam.weight !== null && exam.weight !== undefined);
  const percent = weighted
    ? weightedAverage(valid.map((exam) => ({ percent: exam.percent, weight: exam.weight })))
    : simpleAverage(valid);
  return { percent, weighted, count: valid.length };
}

export function overallAverage(percents: (number | null)[]): number | null {
  const valid = percents.filter((value): value is number => value !== null && Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (current === null || current === undefined) return null;
  if (previous === null || previous === undefined) return null;
  return Math.round((current - previous) * 10) / 10;
}

export function linearTrend(percents: { percent: number; date: string }[]): {
  direction: TrendDirection;
  slope: number | null;
  sampleSize: number;
} {
  if (percents.length < 3) {
    return { direction: "insufficient", slope: null, sampleSize: percents.length };
  }
  const sorted = [...percents].sort((a, b) => a.date.localeCompare(b.date));
  const count = sorted.length;
  const meanX = (count - 1) / 2;
  const meanY = sorted.reduce((sum, item) => sum + item.percent, 0) / count;
  let numerator = 0;
  let denominator = 0;
  sorted.forEach((item, index) => {
    numerator += (index - meanX) * (item.percent - meanY);
    denominator += (index - meanX) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const rounded = Math.round(slope * 100) / 100;
  if (slope >= 0.5) return { direction: "up", slope: rounded, sampleSize: count };
  if (slope <= -0.5) return { direction: "down", slope: rounded, sampleSize: count };
  return { direction: "stable", slope: rounded, sampleSize: count };
}

export function trendLabel(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return "رو به بهبود";
    case "down":
      return "کمی افت";
    case "stable":
      return "ثابت";
    default:
      return "دادهٔ کافی نیست";
  }
}

export function buildSubjectStats(
  subjects: Subject[],
  exams: Exam[],
  gradeScale: number,
  allTimeExams: Exam[] = exams,
  previousExams?: Exam[],
): SubjectPeriodStats[] {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const grouped = new Map<string, Exam[]>();
  exams.forEach((exam) => {
    const list = grouped.get(exam.subjectId) ?? [];
    list.push(exam);
    grouped.set(exam.subjectId, list);
  });

  const rows = Array.from(grouped.entries()).map(
    ([subjectId, subjectExams]): SubjectPeriodStats | null => {
      const subject = subjectMap.get(subjectId);
      const valid = gradedExams(subjectExams);
      if (!subject || valid.length === 0) return null;
      const method = subjectAverage(subjectExams);
      const sorted = [...valid].sort((a, b) => {
        const dateCompare = a.examDate.localeCompare(b.examDate);
        return dateCompare !== 0 ? dateCompare : a.createdAt.localeCompare(b.createdAt);
      });
      const latest = sorted.at(-1) ?? null;
      const allTimeValid = gradedExams(allTimeExams.filter((exam) => exam.subjectId === subjectId));
      const allTimeMethod = subjectAverage(allTimeValid);
      const previousMethod = previousExams
        ? subjectAverage(previousExams.filter((exam) => exam.subjectId === subjectId))
        : null;
      return {
        subjectId,
        subjectName: subject.name,
        subjectColor: subject.color,
        subjectIcon: subject.icon,
        examCount: valid.length,
        averagePercent: method.percent ?? 0,
        scaleValue: scaleValue(method.percent, gradeScale) ?? 0,
        highestPercent: Math.max(...valid.map((exam) => exam.percent)),
        lowestPercent: Math.min(...valid.map((exam) => exam.percent)),
        latestPercent: latest?.percent ?? null,
        latestDate: latest?.examDate ?? null,
        weighted: method.weighted,
        allTimePercent: allTimeMethod.percent,
        allTimeScaleValue: scaleValue(allTimeMethod.percent, gradeScale),
        changeFromPrevious:
          previousMethod && previousMethod.percent !== null && method.percent !== null
            ? percentChange(method.percent, previousMethod.percent)
            : null,
      } satisfies SubjectPeriodStats;
    },
  );
  return rows
    .filter((item): item is SubjectPeriodStats => item !== null)
    .sort((a, b) => b.averagePercent - a.averagePercent);
}

export function buildExamEntries(
  exams: Exam[],
  subjects: Subject[],
  gradeScale: number,
): ExamPeriodEntry[] {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  return gradedExams(exams)
    .map((exam) => {
      const subject = subjectMap.get(exam.subjectId);
      return {
        id: exam.id,
        title: exam.title,
        subjectName: subject?.name ?? "درس",
        subjectColor: subject?.color ?? "violet",
        examDate: exam.examDate,
        grade: exam.grade ?? 0,
        maxGrade: exam.maxGrade,
        percent: Math.round(exam.percent * 10) / 10,
        scaleValue: scaleValue(exam.percent, gradeScale) ?? 0,
      } satisfies ExamPeriodEntry;
    })
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
}

export function gradeDistribution(percents: number[]): GradeDistributionBucket[] {
  const buckets: GradeDistributionBucket[] = [
    { label: "زیر ۵۰٪", count: 0, min: 0, max: 50 },
    { label: "۵۰ تا ۷۰٪", count: 0, min: 50, max: 70 },
    { label: "۷۰ تا ۸۵٪", count: 0, min: 70, max: 85 },
    { label: "۸۵٪ و بالاتر", count: 0, min: 85, max: 100 },
  ];
  percents.forEach((percent) => {
    const bucket = buckets.find((item, index) =>
      percent >= item.min && (percent < item.max || (index === buckets.length - 1 && percent === item.max)),
    );
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

export function describeTrend(direction: TrendDirection): string {
  if (direction === "insufficient") {
    return "برای تشخیص روند، دست‌کم سه نمره لازم است.";
  }
  if (direction === "up") return "نمره‌هایت روند رو به بهبود دارند.";
  if (direction === "down") return "روند نمره‌ها کمی نزولی است؛ یک برنامهٔ مرور کوتاه می‌تواند کمک کند.";
  return "نمره‌هایت تقریباً ثابت مانده‌اند.";
}

export function strengthsAndNeeds(
  stats: SubjectPeriodStats[],
  overallPercent: number | null,
): { strengths: string[]; needs: string[] } {
  if (overallPercent === null || stats.length === 0) {
    return {
      strengths: [],
      needs: [],
    };
  }
  if (stats.length < 2) {
    return {
      strengths: [],
      needs: [],
    };
  }
  const strengths = stats
    .filter((item) => item.averagePercent >= overallPercent + 5)
    .slice(0, 3)
    .map((item) => `${item.subjectName} با میانگین ${Math.round(item.averagePercent)}٪ یکی از نقطه‌های قوت این دوره بود.`);
  const needs = stats
    .filter((item) => item.averagePercent <= overallPercent - 5 || item.averagePercent < 50)
    .slice(0, 3)
    .map((item) => `${item.subjectName} با میانگین ${Math.round(item.averagePercent)}٪ به کمی تمرین و مرور بیشتر نیاز دارد.`);
  return { strengths, needs };
}

export function getSubjectSubjectMap(subjects: Subject[]) {
  return new Map(subjects.map((subject) => [subject.id, subject]));
}
