"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { Assignment } from "../types/assignment";

type AiPlanModalProps = {
  assignment: Assignment;
  isRegenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
};

function formatGeneratedAt(value: string | null): string {
  if (!value) return "生成日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "生成日時不明";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AiPlanModal({ assignment, isRegenerating, error, onClose, onRegenerate }: AiPlanModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const plan = assignment.aiPlan;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!plan) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={handleBackdropClick}>
      <section role="dialog" aria-modal="true" aria-labelledby="ai-plan-title" className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-indigo-600">AI STUDY PLAN</p>
            <h2 id="ai-plan-title" className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950">{assignment.title}のAI計画</h2>
            <p className="mt-2 text-sm text-slate-500">{formatGeneratedAt(assignment.aiPlanGeneratedAt)}に生成</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label={`${assignment.title}のAI計画を閉じる`} className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">×</button>
        </div>

        <div className="mt-6 rounded-2xl bg-indigo-50 p-4 sm:p-5">
          <p className="text-sm font-bold text-indigo-950">計画の概要</p>
          <p className="mt-1 text-sm leading-6 text-indigo-900">{plan.summary}</p>
          <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700">合計の目安：{plan.totalEstimatedMinutes}分</p>
        </div>

        <ol className="mt-6 space-y-3">
          {plan.steps.map((step, index) => (
            <li key={`${index}-${step.title}`} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-extrabold text-white">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{step.estimatedMinutes}分</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {plan.tips.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-bold text-amber-900">取り組みのヒント</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
              {plan.tips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}
            </ul>
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-500">AIの提案は目安です。課題の内容や授業の指示に合わせて調整してください。</p>
        {isRegenerating && <p aria-live="polite" className="mt-3 text-sm font-bold text-indigo-700">AIが計画を作成中です…</p>}
        {error && <p role="alert" aria-live="assertive" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">閉じる</button>
          <button type="button" onClick={onRegenerate} disabled={isRegenerating} aria-label={`${assignment.title}のAI計画を再生成`} className="min-h-12 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{isRegenerating ? "生成中…" : "AI計画を再生成"}</button>
        </div>
      </section>
    </div>
  );
}
