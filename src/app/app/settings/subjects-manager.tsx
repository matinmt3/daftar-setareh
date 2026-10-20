"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Palette, Pencil, Plus, Save } from "lucide-react";
import type { Subject } from "@/lib/types";
import { SUBJECT_COLORS, SUBJECT_ICONS, subjectColor } from "@/lib/constants";
import {
  createSubjectAction,
  deleteSubjectAction,
  toggleSubjectArchiveAction,
  updateSubjectAction,
} from "@/server/actions/subjects";
import { Field, InlineAlert, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SubjectIcon } from "@/components/subject-icon";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { runAction } from "@/components/ui/run-action";

type Editor = { open: boolean; subject: Subject | null };

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor>({ open: false, subject: null });
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState("violet");
  const [icon, setIcon] = useState("book-open");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const active = subjects.filter((subject) => !subject.isArchived);
  const archived = subjects.filter((subject) => subject.isArchived);

  const openEditor = (subject: Subject | null) => {
    setEditor({ open: true, subject });
    setName(subject?.name ?? "");
    setColor(subject?.color ?? "violet");
    setIcon(subject?.icon ?? "book-open");
    setError(null);
    setFieldErrors({});
  };

  const closeEditor = () => setEditor({ open: false, subject: null });

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => editor.subject
        ? updateSubjectAction({ id: editor.subject.id, name, color, icon })
        : createSubjectAction({ name, color, icon }));
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      showToast({ title: editor.subject ? "درس ویرایش شد" : "درس اضافه شد", description: result.message, tone: "success" });
      closeEditor();
      router.refresh();
    });
  };

  const toggleArchive = (subject: Subject) => {
    startTransition(async () => {
      const result = await runAction(() => toggleSubjectArchiveAction({
        id: subject.id,
        archived: !subject.isArchived,
      }));
      if (!result.ok) {
        showToast({ title: "تغییر وضعیت درس انجام نشد", description: result.message, tone: "error" });
        return;
      }
      showToast({ title: result.message ?? "وضعیت درس تغییر کرد", tone: "success" });
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-ink">درس‌های من</h2>
          <p className="mt-0.5 text-[0.6rem] text-muted">
            {active.length} درس فعال{archived.length ? ` و ${archived.length} بایگانی‌شده` : ""}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => openEditor(null)}>
          <Plus className="size-4" aria-hidden="true" />
          درس تازه
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-paper/40 px-4 py-6 text-center">
          <Palette className="mx-auto size-5 text-muted" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold text-ink">هنوز درسی نساخته‌ای.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {active.map((subject) => {
            const palette = subjectColor(subject.color);
            return (
              <div
                key={subject.id}
                data-testid="subject-card"
                className="flex items-center gap-2.5 rounded-xl border border-line/80 bg-white px-3 py-2.5"
              >
                <SubjectIcon icon={subject.icon} color={subject.color} className="size-9 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{subject.name}</p>
                  <p className="mt-0.5 text-[0.55rem]" style={{ color: palette.hex }}>
                    {palette.label}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => openEditor(subject)}
                    disabled={pending}
                    className="flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper hover:text-violet-deep"
                    aria-label={`ویرایش ${subject.name}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(subject)}
                    disabled={pending}
                    className="flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper hover:text-ink"
                    aria-label={`بایگانی ${subject.name}`}
                  >
                    <Archive className="size-3.5" aria-hidden="true" />
                  </button>
                  <ConfirmDeleteButton
                    compact
                    action={() => deleteSubjectAction({ id: subject.id })}
                    title="حذف این درس؟"
                    description="اگر برای این درس آزمون یا گزارش ثبت شده باشد، حذف انجام نمی‌شود؛ در آن صورت آن را بایگانی کن."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archived.length > 0 ? (
        <div className="mt-4 rounded-xl border border-line/70 bg-paper/50 p-3">
          <p className="mb-2 text-[0.62rem] font-bold text-muted">بایگانی</p>
          <ul className="space-y-1.5">
            {archived.map((subject) => (
              <li key={subject.id} data-testid="subject-card" className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-2">
                <SubjectIcon icon={subject.icon} color={subject.color} className="size-6 rounded-md opacity-60" />
                <span className="min-w-0 flex-1 truncate text-[0.65rem] text-muted">{subject.name}</span>
                <button
                  type="button"
                  onClick={() => toggleArchive(subject)}
                  disabled={pending}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.55rem] font-semibold text-violet-deep transition-colors hover:bg-violet-soft"
                >
                  <ArchiveRestore className="size-3" aria-hidden="true" />
                  بازگردانی
                </button>
                <ConfirmDeleteButton
                  compact
                  action={() => deleteSubjectAction({ id: subject.id })}
                  title="حذف این درس؟"
                  description="این درس در بایگانی است. حذف فقط برای درس‌های بدون آزمون و گزارش ممکن است."
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Modal
        open={editor.open}
        onOpenChange={(open) => (open ? setEditor((current) => ({ ...current, open })) : closeEditor())}
        busy={pending}
        title={editor.subject ? "ویرایش درس" : "درس تازه"}
        description="رنگ و نشان درس را طوری انتخاب کن که روی نمودارها سریع شناخته شود."
        size="sm"
      >
        <form onSubmit={save} className="space-y-4">
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <Field label="نام درس" htmlFor="subject-name" required error={fieldErrors.name?.[0]}>
            <Input
              id="subject-name"
              value={name}
              maxLength={40}
              placeholder="مثلاً ریاضی"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="رنگ" error={fieldErrors.color?.[0]}>
            <div className="grid grid-cols-5 gap-1.5">
              {SUBJECT_COLORS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setColor(item.value)}
                  aria-label={item.label}
                  aria-pressed={color === item.value}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-lg border-2 transition-transform",
                    color === item.value ? "scale-105 border-ink" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: item.soft }}
                >
                  <span className="size-3.5 rounded-full" style={{ backgroundColor: item.hex }} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="نشان" error={fieldErrors.icon?.[0]}>
            <div className="grid grid-cols-5 gap-1.5">
              {SUBJECT_ICONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setIcon(item.value)}
                  aria-pressed={icon === item.value}
                  className={cn(
                    "rounded-lg border px-1 py-2 text-[0.5rem] transition-colors",
                    icon === item.value
                      ? "border-violet bg-violet-soft text-violet-deep"
                      : "border-line bg-white text-muted hover:border-violet/40",
                  )}
                >
                  <SubjectIcon icon={item.value} color={color} className="mx-auto mb-1 size-7 rounded-md" />
                  <span className="block truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <Button variant="ghost" type="button" onClick={closeEditor} disabled={pending}>
              انصراف
            </Button>
            <Button type="submit" loading={pending}>
              <Save className="size-4" aria-hidden="true" />
              {editor.subject ? "ذخیره" : "افزودن درس"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

