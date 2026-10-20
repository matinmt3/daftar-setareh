"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ExamWithSubject, Subject } from "@/lib/types";
import { deleteExamAction } from "@/server/actions/exams";
import { examPercent } from "@/lib/grades";
import { formatShortDate, relativeDayLabel } from "@/lib/dates";
import { faNum, faPercent, faScoreFromPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SubjectIcon } from "@/components/subject-icon";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ExamForm } from "./exam-form";

type StatusFilter = "all" | "graded" | "pending";

export function ExamManager({
  exams,
  subjects,
  gradeScale,
}: {
  exams: ExamWithSubject[];
  subjects: Subject[];
  gradeScale: number;
}) {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExamWithSubject | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim();
    return exams.filter((exam) => {
      if (subjectId !== "all" && exam.subjectId !== subjectId) return false;
      if (status === "graded" && exam.grade === null) return false;
      if (status === "pending" && exam.grade !== null) return false;
      if (query && !exam.title.includes(query) && !exam.subjectName.includes(query)) return false;
      return true;
    });
  }, [exams, search, status, subjectId]);

  const graded = filtered.filter((exam) => exam.grade !== null).length;
  const filteredPercent = (() => {
    const values = filtered
      .map((exam) => examPercent(exam))
      .filter((value): value is number => value !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  })();

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (exam: ExamWithSubject) => {
    setEditing(exam);
    setOpen(true);
  };

  return (
    <>
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <GraduationCap className="size-4 text-violet-deep" aria-hidden="true" />
              فهرست آزمون‌ها
            </h2>
            <p className="mt-1 text-[0.65rem] text-muted">
              {faNum(filtered.length)} آزمون • {faNum(graded)} با نمره
              {filteredPercent !== null ? ` • میانگین ${faPercent(filteredPercent)}` : ""}
            </p>
          </div>
          <Button onClick={openNew} size="sm" disabled={subjects.length === 0}>
            <Plus className="size-4" aria-hidden="true" />
            آزمون تازه
          </Button>
        </div>

        <div className="grid gap-2 py-3 sm:grid-cols-[1fr_11rem_10rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی عنوان یا درس..."
              className="h-10 pr-9 text-xs"
              aria-label="جست‌وجوی آزمون"
            />
          </div>
          <Select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="h-10 text-xs"
            aria-label="فیلتر درس"
          >
            <option value="all">همهٔ درس‌ها</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="h-10 text-xs"
            aria-label="فیلتر وضعیت نمره"
          >
            <option value="all">همهٔ وضعیت‌ها</option>
            <option value="graded">دارای نمره</option>
            <option value="pending">بدون نمره</option>
          </Select>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-4 py-8 text-center">
            <Filter className="mx-auto size-5 text-muted" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold">برای ثبت آزمون، اول یک درس بساز.</p>
            <a href="/app/settings#subjects" className="btn btn-secondary mt-3 text-xs">مدیریت درس‌ها</a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-4 py-10 text-center">
            <SlidersHorizontal className="mx-auto size-5 text-muted" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold">{exams.length === 0 ? "هنوز آزمونی ثبت نکرده‌ای" : "آزمونی با این فیلتر پیدا نشد"}</p>
            <p className="mt-1 text-[0.65rem] text-muted">
              {exams.length === 0 ? "اولین آزمون را ثبت کن تا میانگین درس‌ها شکل بگیرد." : "فیلترها را تغییر بده یا آزمون تازه اضافه کن."}
            </p>
            {exams.length === 0 ? (
              <Button onClick={openNew} size="sm" className="mt-3">
                <Plus className="size-3.5" aria-hidden="true" />
                ثبت اولین آزمون
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_6rem_6rem_8rem_5.5rem] gap-3 border-y border-line bg-[#fdfaf4] px-3 py-2 text-[0.58rem] font-bold text-muted lg:grid">
              <span>آزمون و درس</span>
              <span>تاریخ</span>
              <span>وزن</span>
              <span className="text-left">نمره</span>
              <span className="text-left">عملیات</span>
            </div>
            <div className="divide-y divide-line">
              {filtered.map((exam) => {
                const percent = examPercent(exam);
                return (
                  <article
                    key={exam.id}
                    className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_6rem_6rem_8rem_5.5rem] lg:items-center lg:px-3"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <SubjectIcon icon={exam.subjectIcon} color={exam.subjectColor} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink">{exam.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[0.6rem] text-muted">{exam.subjectName}</span>
                          {exam.grade === null ? (
                            <Badge tone="outline" className="text-[0.52rem]">در انتظار نمره</Badge>
                          ) : (
                            <Badge
                              tone={percent !== null && percent >= 75 ? "mint" : percent !== null && percent >= 50 ? "gold" : "coral"}
                              className="text-[0.52rem]"
                            >
                              {faPercent(percent)}
                            </Badge>
                          )}
                        </div>
                        {exam.notes ? (
                          <p className="mt-1 line-clamp-1 text-[0.6rem] text-muted">{exam.notes}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.65rem] text-muted lg:block">
                      <CalendarDays className="size-3.5 lg:hidden" aria-hidden="true" />
                      <span className="num">{formatShortDate(exam.examDate)}</span>
                      <span className="block text-[0.55rem] text-muted">{relativeDayLabel(exam.examDate)}</span>
                    </div>
                    <div className="hidden text-[0.65rem] text-muted lg:block">
                      {exam.weight === null ? "—" : faNum(exam.weight)}
                    </div>
                    <div className="flex items-center justify-between gap-2 lg:justify-end">
                      <span className="text-[0.58rem] text-muted lg:hidden">نمره</span>
                      {exam.grade === null || percent === null ? (
                        <span className="text-[0.65rem] text-muted">ثبت نشده</span>
                      ) : (
                        <div className="text-left">
                          <span className="num text-sm font-extrabold text-ink">
                            {faNum(exam.grade)}
                            <span className="mr-0.5 text-[0.55rem] font-medium text-muted">/{faNum(exam.maxGrade)}</span>
                          </span>
                          <p className="num mt-0.5 text-[0.55rem] text-muted">
                            معادل {faScoreFromPercent(percent, gradeScale)} از {faNum(gradeScale)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(exam)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-violet-soft hover:text-violet-deep"
                        aria-label={`ویرایش ${exam.title}`}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <ConfirmDeleteButton
                        action={() => deleteExamAction({ id: exam.id })}
                        title="حذف آزمون؟"
                        description={`آزمون «${exam.title}» از میانگین‌ها و کارنامه‌ها حذف می‌شود.`}
                        compact
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl bg-paper px-3 py-2 text-[0.62rem] text-muted">
              وزن‌ها فقط روی میانگین همان درس اثر می‌گذارند. آزمون بدون نمره در محاسبه‌ها لحاظ نمی‌شود.
            </div>
          </>
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        title={editing ? "ویرایش آزمون" : "ثبت آزمون تازه"}
        description={editing ? "نمره، تاریخ یا جزئیات آزمون را اصلاح کن." : "با ثبت آزمون، تصویر دقیق‌تری از درس‌ها ساخته می‌شود."}
        size="md"
      >
        {open ? (
          <ExamForm
            key={editing?.id ?? "new"}
            subjects={subjects}
            exam={editing}
            gradeScale={gradeScale}
            onDone={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}
