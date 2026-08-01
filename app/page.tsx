type Priority = "高" | "中" | "低";
type Status = "未着手" | "進行中" | "完了";

type Assignment = {
  id: number;
  subject: string;
  title: string;
  dueDate: string;
  dueLabel: string;
  priority: Priority;
  status: Status;
};

const assignments: Assignment[] = [
  {
    id: 1,
    subject: "データベース論",
    title: "データベース演習レポート",
    dueDate: "2026-08-05",
    dueLabel: "8月5日（水）",
    priority: "高",
    status: "未着手",
  },
  {
    id: 2,
    subject: "人工知能概論",
    title: "AI基礎課題",
    dueDate: "2026-08-07",
    dueLabel: "8月7日（金）",
    priority: "中",
    status: "進行中",
  },
  {
    id: 3,
    subject: "情報システム工学実験",
    title: "ネットワーク実験レポート",
    dueDate: "2026-08-10",
    dueLabel: "8月10日（月）",
    priority: "高",
    status: "未着手",
  },
];

const summary = [
  { label: "未完了の課題", value: 3, note: "前週比 −1", color: "bg-indigo-500" },
  { label: "今週が期限", value: 2, note: "早めに確認", color: "bg-amber-400" },
  { label: "完了した課題", value: 8, note: "今学期", color: "bg-emerald-500" },
];

const priorityStyles: Record<Priority, string> = {
  高: "bg-rose-50 text-rose-700 ring-rose-600/10",
  中: "bg-amber-50 text-amber-700 ring-amber-600/10",
  低: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

const statusStyles: Record<Status, string> = {
  未着手: "bg-slate-100 text-slate-600",
  進行中: "bg-indigo-50 text-indigo-700",
  完了: "bg-emerald-50 text-emerald-700",
};

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start gap-4">
        <button
          type="button"
          aria-label={`${assignment.title}を完了にする`}
          className="mt-1 size-5 shrink-0 rounded-full border-2 border-slate-300 transition hover:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold tracking-wide text-indigo-600">
            {assignment.subject}
          </p>
          <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
            {assignment.title}
          </h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className={priorityStyles[assignment.priority]}>
              優先度：{assignment.priority}
            </Badge>
            <Badge className={statusStyles[assignment.status]}>{assignment.status}</Badge>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-slate-400">締切</p>
          <time dateTime={assignment.dueDate} className="mt-1 block text-sm font-bold text-slate-700">
            {assignment.dueLabel}
          </time>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-200">
              CF
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-950">CampusFlow AI</p>
              <p className="text-xs font-medium text-slate-400">学びを、もっとスムーズに。</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-5"
          >
            <span aria-hidden="true" className="text-lg leading-none">＋</span>
            <span className="hidden sm:inline">課題を追加</span>
            <span className="sm:hidden">追加</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section aria-labelledby="today-heading">
          <p className="text-sm font-semibold text-indigo-600">2026年8月2日（日）</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 id="today-heading" className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                今日の課題
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                優先度の高い課題から、少しずつ進めましょう。
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              今日の進捗 <span className="ml-1 text-indigo-600">0 / 2</span>
            </p>
          </div>
        </section>

        <section aria-label="課題の集計" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {summary.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <span className={`size-2.5 rounded-full ${item.color}`} aria-hidden="true" />
              </div>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-3xl font-extrabold tracking-tight text-slate-950">{item.value}<span className="ml-1 text-base font-bold text-slate-400">件</span></p>
                <p className="pb-1 text-xs font-medium text-slate-400">{item.note}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <section aria-labelledby="focus-heading">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="focus-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今日取り組む課題</h2>
                <p className="mt-1 text-sm text-slate-500">締切が近い2件をピックアップ</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">2件</span>
            </div>
            <div className="space-y-3">
              {assignments.slice(0, 2).map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </section>

          <section aria-labelledby="upcoming-heading">
            <div className="mb-4">
              <h2 id="upcoming-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今後の締切</h2>
              <p className="mt-1 text-sm text-slate-500">近い順に表示しています</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.035)]">
              <ol className="divide-y divide-slate-100">
                {assignments.map((assignment, index) => (
                  <li key={assignment.id} className="p-5">
                    <div className="flex gap-4">
                      <div className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-slate-50 py-2 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">8月</span>
                        <span className="text-lg font-extrabold leading-5 text-slate-800">{[5, 7, 10][index]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-indigo-600">{assignment.subject}</p>
                        <h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">{assignment.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <time dateTime={assignment.dueDate} className="text-xs font-medium text-slate-500">締切：{assignment.dueLabel}</time>
                          <Badge className={priorityStyles[assignment.priority]}>優先度：{assignment.priority}</Badge>
                          <Badge className={statusStyles[assignment.status]}>{assignment.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
