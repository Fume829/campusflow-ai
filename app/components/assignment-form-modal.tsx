"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { priorities, statuses, type AssignmentInput } from "../types/assignment";

type AssignmentFormModalProps = {
  mode: "add" | "edit";
  initialValues?: AssignmentInput;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (values: AssignmentInput) => Promise<void>;
};

type FormErrors = Partial<Record<"title" | "subject" | "dueDate", string>>;

const emptyFormValues: AssignmentInput = {
  title: "",
  subject: "",
  dueDate: "",
  priority: "中",
  status: "未着手",
};

const fieldClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:text-sm";

export function AssignmentFormModal({
  mode,
  initialValues = emptyFormValues,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: AssignmentFormModalProps) {
  const [values, setValues] = useState<AssignmentInput>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isEditing = mode === "edit";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  const updateValue = <Key extends keyof AssignmentInput>(
    key: Key,
    value: AssignmentInput[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "title" || key === "subject" || key === "dueDate") {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const nextErrors: FormErrors = {};

    if (!values.title.trim()) nextErrors.title = "課題名を入力してください。";
    if (!values.subject.trim()) nextErrors.subject = "科目名を入力してください。";
    if (!values.dueDate) nextErrors.dueDate = "締切日を入力してください。";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      ...values,
      title: values.title.trim(),
      subject: values.subject.trim(),
    });
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-form-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-indigo-600">
              {isEditing ? "EDIT ASSIGNMENT" : "NEW ASSIGNMENT"}
            </p>
            <h2 id="assignment-form-title" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              課題を{isEditing ? "編集" : "追加"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing ? "課題の内容を変更できます。" : "課題の内容と締切を入力してください。"}
            </p>
            {isEditing && (
              <p className="mt-2 text-xs leading-5 text-amber-700">
                課題内容を変更した場合は、必要に応じてAI計画を再生成してください。
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={`${isEditing ? "編集" : "追加"}モーダルを閉じる`}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          {submitError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
              {submitError}
            </p>
          )}
          <label className="block text-sm font-bold text-slate-700">
            課題名 <span className="text-rose-500">*</span>
            <input
              ref={titleInputRef}
              type="text"
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              placeholder="例：データベース演習レポート"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={fieldClassName}
            />
            {errors.title && <span id="title-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.title}</span>}
          </label>

          <label className="block text-sm font-bold text-slate-700">
            科目名 <span className="text-rose-500">*</span>
            <input
              type="text"
              value={values.subject}
              onChange={(event) => updateValue("subject", event.target.value)}
              placeholder="例：データベース論"
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "subject-error" : undefined}
              className={fieldClassName}
            />
            {errors.subject && <span id="subject-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.subject}</span>}
          </label>

          <label className="block text-sm font-bold text-slate-700">
            締切日 <span className="text-rose-500">*</span>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) => updateValue("dueDate", event.target.value)}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? "due-date-error" : undefined}
              className={fieldClassName}
            />
            {errors.dueDate && <span id="due-date-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.dueDate}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <label className="block text-sm font-bold text-slate-700">
              優先度
              <select
                value={values.priority}
                onChange={(event) => updateValue("priority", event.target.value as AssignmentInput["priority"])}
                className={fieldClassName}
              >
                {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              状態
              <select
                value={values.status}
                onChange={(event) => updateValue("status", event.target.value as AssignmentInput["status"])}
                className={fieldClassName}
              >
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "保存中…" : isEditing ? "変更を保存" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
