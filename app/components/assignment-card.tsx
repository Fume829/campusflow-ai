import { formatJapaneseDateTime } from "../lib/assignments";
import type { Assignment, AssignmentStatus, Priority } from "../types/assignment";

const priorityStyles: Record<Priority, string> = {
  高: "bg-rose-50 text-rose-700 ring-rose-600/10",
  中: "bg-amber-50 text-amber-700 ring-amber-600/10",
  低: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

const statusStyles: Record<AssignmentStatus, string> = {
  未着手: "bg-slate-100 text-slate-600",
  進行中: "bg-indigo-50 text-indigo-700",
  完了: "bg-emerald-50 text-emerald-700",
};

export function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={priorityStyles[priority]}>優先度：{priority}</Badge>;
}

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return <Badge className={statusStyles[status]}>{status}</Badge>;
}

type AssignmentCardProps = {
  assignment: Assignment;
  onToggleStatus: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment, trigger: HTMLButtonElement) => void;
  onDelete: (assignment: Assignment, trigger: HTMLButtonElement) => void;
  onGenerateAiPlan: (assignment: Assignment, trigger: HTMLButtonElement) => void;
  onViewAiPlan: (assignment: Assignment, trigger: HTMLButtonElement) => void;
  isStatusUpdating: boolean;
  isAiGenerating: boolean;
  aiPlanError: string | null;
  actionsDisabled: boolean;
};

export function AssignmentCard({
  assignment,
  onToggleStatus,
  onEdit,
  onDelete,
  onGenerateAiPlan,
  onViewAiPlan,
  isStatusUpdating,
  isAiGenerating,
  aiPlanError,
  actionsDisabled,
}: AssignmentCardProps) {
  const isCompleted = assignment.status === "完了";

  return (
    <article className={`group rounded-2xl border bg-white p-5 transition hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6 ${isCompleted ? "border-emerald-100 bg-emerald-50/20" : "border-slate-200 hover:border-indigo-200"}`}>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggleStatus(assignment)}
          disabled={isStatusUpdating || actionsDisabled}
          aria-label={`${assignment.title}を${isCompleted ? "未着手に戻す" : "完了にする"}`}
          aria-pressed={isCompleted}
          className="-m-3 mt-[-8px] grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={`size-5 rounded-full border-2 transition ${isCompleted ? "border-emerald-500 bg-emerald-500 shadow-[inset_0_0_0_4px_white]" : "border-slate-300 hover:border-indigo-500"}`}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold tracking-wide text-indigo-600">{assignment.subject}</p>
          <h3 className={`text-base font-bold leading-snug sm:text-lg ${isCompleted ? "text-slate-400 line-through decoration-2" : "text-slate-900"}`}>
            {assignment.title}
          </h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={assignment.priority} />
            <StatusBadge status={assignment.status} />
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-medium text-slate-400">締切</p>
          <time dateTime={assignment.dueAt} className="mt-1 block text-sm font-bold text-slate-700">
            {formatJapaneseDateTime(assignment.dueAt)}
          </time>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 text-right sm:hidden">
        <span className="mr-2 text-xs font-medium text-slate-400">締切</span>
        <time dateTime={assignment.dueAt} className="text-sm font-bold text-slate-700">
          {formatJapaneseDateTime(assignment.dueAt)}
        </time>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {assignment.aiPlan ? (
            <>
              <button type="button" onClick={(event) => onViewAiPlan(assignment, event.currentTarget)} aria-label={`${assignment.title}のAI計画を見る`} className="min-h-11 rounded-xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100">AI計画を見る</button>
              <button type="button" onClick={(event) => onGenerateAiPlan(assignment, event.currentTarget)} disabled={isAiGenerating || actionsDisabled} aria-label={`${assignment.title}のAI計画を再生成`} className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50">再生成</button>
            </>
          ) : (
            <button type="button" onClick={(event) => onGenerateAiPlan(assignment, event.currentTarget)} disabled={isAiGenerating || actionsDisabled} aria-label={`${assignment.title}をAIで小さな作業に分解`} className="min-h-11 rounded-xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-50">AIで計画を作る</button>
          )}
        </div>
        <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={(event) => onEdit(assignment, event.currentTarget)}
          disabled={actionsDisabled}
          aria-label={`${assignment.title}を編集`}
          className="min-h-11 rounded-xl px-4 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          編集
        </button>
        <button
          type="button"
          onClick={(event) => onDelete(assignment, event.currentTarget)}
          disabled={actionsDisabled}
          aria-label={`${assignment.title}を削除`}
          className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          削除
        </button>
        </div>
      </div>
      {isAiGenerating && <p aria-live="polite" className="mt-2 text-sm font-semibold text-indigo-700">AIが計画を作成中です…</p>}
      {aiPlanError && <p role="alert" aria-live="assertive" className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{aiPlanError}</p>}
    </article>
  );
}
