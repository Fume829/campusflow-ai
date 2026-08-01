import { formatJapaneseDate } from "../lib/assignments";
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

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={`mt-1 size-5 shrink-0 rounded-full border-2 ${assignment.status === "完了" ? "border-emerald-500 bg-emerald-500 shadow-[inset_0_0_0_4px_white]" : "border-slate-300"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold tracking-wide text-indigo-600">{assignment.subject}</p>
          <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">{assignment.title}</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={assignment.priority} />
            <StatusBadge status={assignment.status} />
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-medium text-slate-400">締切</p>
          <time dateTime={assignment.dueDate} className="mt-1 block text-sm font-bold text-slate-700">
            {formatJapaneseDate(assignment.dueDate)}
          </time>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 text-right sm:hidden">
        <span className="mr-2 text-xs font-medium text-slate-400">締切</span>
        <time dateTime={assignment.dueDate} className="text-sm font-bold text-slate-700">
          {formatJapaneseDate(assignment.dueDate)}
        </time>
      </div>
    </article>
  );
}
