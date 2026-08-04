"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initialAssignments } from "../data/assignments";
import {
  assignmentStorageKey,
  formatJapaneseDate,
  formatJapaneseToday,
  isAssignment,
  isDueThisWeek,
  parseLocalDate,
  sortByDueDate,
} from "../lib/assignments";
import type { Assignment, AssignmentFormValues } from "../types/assignment";
import { AssignmentFormModal } from "./assignment-form-modal";
import { AssignmentCard, PriorityBadge, StatusBadge } from "./assignment-card";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

type FormModalState =
  | { mode: "add" }
  | { mode: "edit"; assignment: Assignment };

function createAssignmentId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `assignment-${Date.now()}`;
}

function loadStoredAssignments(): Assignment[] | null {
  try {
    const storedValue = window.localStorage.getItem(assignmentStorageKey);
    if (!storedValue) return null;
    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) && parsedValue.every(isAssignment) ? parsedValue : null;
  } catch {
    return null;
  }
}

type DashboardProps = {
  userEmail: string;
};

export function Dashboard({ userEmail }: DashboardProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const lastActionButtonRef = useRef<HTMLButtonElement | null>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const restoreAssignments = (event?: StorageEvent) => {
      if (event && event.key !== assignmentStorageKey) return;
      const storedAssignments = loadStoredAssignments();
      if (storedAssignments) setAssignments(storedAssignments);
    };

    const restoreTimer = window.setTimeout(restoreAssignments, 0);
    window.addEventListener("storage", restoreAssignments);

    return () => {
      window.clearTimeout(restoreTimer);
      window.removeEventListener("storage", restoreAssignments);
    };
  }, []);

  const restoreActionFocus = useCallback(() => {
    window.setTimeout(() => {
      const target = lastActionButtonRef.current;
      if (target?.isConnected) target.focus();
      else addButtonRef.current?.focus();
    }, 0);
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModal(null);
    restoreActionFocus();
  }, [restoreActionFocus]);

  const closeDeleteModal = useCallback(() => {
    setAssignmentToDelete(null);
    restoreActionFocus();
  }, [restoreActionFocus]);

  const updateAssignments = useCallback((update: (current: Assignment[]) => Assignment[]) => {
    setAssignments((currentAssignments) => {
      const nextAssignments = sortByDueDate(update(currentAssignments));
      try {
        window.localStorage.setItem(assignmentStorageKey, JSON.stringify(nextAssignments));
      } catch {
        // 保存できない環境でも、現在のセッションでは変更内容を表示する。
      }
      return nextAssignments;
    });
  }, []);

  const openAddModal = (trigger: HTMLButtonElement) => {
    lastActionButtonRef.current = trigger;
    setFormModal({ mode: "add" });
  };

  const openEditModal = (assignment: Assignment, trigger: HTMLButtonElement) => {
    lastActionButtonRef.current = trigger;
    setFormModal({ mode: "edit", assignment });
  };

  const openDeleteModal = (assignment: Assignment, trigger: HTMLButtonElement) => {
    lastActionButtonRef.current = trigger;
    setAssignmentToDelete(assignment);
  };

  const handleFormSubmit = (values: AssignmentFormValues) => {
    if (formModal?.mode === "edit") {
      const editingId = formModal.assignment.id;
      updateAssignments((current) => current.map((assignment) => (
        assignment.id === editingId ? { id: editingId, ...values } : assignment
      )));
    } else {
      const newAssignment: Assignment = { id: createAssignmentId(), ...values };
      updateAssignments((current) => [...current, newAssignment]);
    }
    closeFormModal();
  };

  const handleToggleStatus = (target: Assignment) => {
    updateAssignments((current) => current.map((assignment) => (
      assignment.id === target.id
        ? { ...assignment, status: assignment.status === "完了" ? "未着手" : "完了" }
        : assignment
    )));
  };

  const handleConfirmDelete = () => {
    if (!assignmentToDelete) return;
    const deletingId = assignmentToDelete.id;
    updateAssignments((current) => current.filter((assignment) => assignment.id !== deletingId));
    setAssignmentToDelete(null);
    window.setTimeout(() => addButtonRef.current?.focus(), 0);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLogoutError("ログアウトできませんでした。もう一度お試しください。");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("ログアウトできませんでした。もう一度お試しください。");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sortedAssignments = useMemo(() => sortByDueDate(assignments), [assignments]);
  const focusAssignments = sortedAssignments;
  const unfinishedCount = assignments.filter((assignment) => assignment.status !== "完了").length;
  const dueThisWeekCount = assignments.filter(
    (assignment) => assignment.status !== "完了" && isDueThisWeek(assignment.dueDate, today),
  ).length;
  const completedCount = assignments.filter((assignment) => assignment.status === "完了").length;

  const summary = [
    { label: "未完了の課題", value: unfinishedCount, note: "取り組み中", color: "bg-indigo-500" },
    { label: "今週が期限", value: dueThisWeekCount, note: "早めに確認", color: "bg-amber-400" },
    { label: "完了した課題", value: completedCount, note: "全課題から集計", color: "bg-emerald-500" },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 px-4 py-4 sm:flex-nowrap sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-200">CF</div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-950">CampusFlow AI</p>
              <p className="text-xs font-medium text-slate-400">学びを、もっとスムーズに。</p>
            </div>
          </div>
          <div className="order-3 mt-3 flex min-w-0 w-full items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:order-none sm:mt-0 sm:ml-auto sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
            <div className="min-w-0 text-right sm:max-w-52">
              <p className="hidden text-[10px] font-bold tracking-wide text-slate-400 sm:block">ログイン中</p>
              <p className="truncate text-xs font-semibold text-slate-600" title={userEmail}>{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={`${userEmail}からログアウト`}
              className="min-h-11 shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              {isLoggingOut ? "処理中…" : "ログアウト"}
            </button>
          </div>
          <button
            ref={addButtonRef}
            type="button"
            onClick={(event) => openAddModal(event.currentTarget)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-5"
          >
            <span aria-hidden="true" className="text-lg leading-none">＋</span>
            <span className="hidden sm:inline">課題を追加</span>
            <span className="sm:hidden">追加</span>
          </button>
          {logoutError && (
            <p role="alert" className="order-4 mt-2 w-full text-right text-xs font-medium text-rose-600">
              {logoutError}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section aria-labelledby="today-heading">
          <p className="text-sm font-semibold text-indigo-600">{formatJapaneseToday(today)}</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 id="today-heading" className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">今日の課題</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">優先度の高い課題から、少しずつ進めましょう。</p>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              今日の進捗 <span className="ml-1 text-indigo-600">{completedCount} / {assignments.length}</span>
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
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="focus-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今日取り組む課題</h2>
                <p className="mt-1 text-sm text-slate-500">期限切れ・完了済みを含め、締切が近い順に表示</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{focusAssignments.length}件</span>
            </div>
            {focusAssignments.length > 0 ? (
              <div className="space-y-3">
                {focusAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggleStatus={handleToggleStatus}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">未完了の課題はありません。</div>
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <div className="mb-4">
              <h2 id="upcoming-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今後の締切</h2>
              <p className="mt-1 text-sm text-slate-500">すべての課題を期限が近い順に表示</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.035)]">
              <ol className="divide-y divide-slate-100">
                {sortedAssignments.map((assignment) => {
                  const dueDate = parseLocalDate(assignment.dueDate);
                  return (
                    <li key={assignment.id} className="p-5">
                      <div className="flex gap-4">
                        <div className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-slate-50 py-2 text-center">
                          <span className="text-[10px] font-bold tracking-wide text-slate-400">{dueDate.getMonth() + 1}月</span>
                          <span className="text-lg font-extrabold leading-5 text-slate-800">{dueDate.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-indigo-600">{assignment.subject}</p>
                          <h3 className={`mt-1 text-sm font-bold leading-5 ${assignment.status === "完了" ? "text-slate-400 line-through decoration-2" : "text-slate-900"}`}>
                            {assignment.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <time dateTime={assignment.dueDate} className="text-xs font-medium text-slate-500">締切：{formatJapaneseDate(assignment.dueDate)}</time>
                            <PriorityBadge priority={assignment.priority} />
                            <StatusBadge status={assignment.status} />
                          </div>
                          <div className="mt-2 flex gap-1">
                            <button
                              type="button"
                              onClick={(event) => openEditModal(assignment, event.currentTarget)}
                              aria-label={`${assignment.title}を編集`}
                              className="min-h-11 rounded-lg px-3 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openDeleteModal(assignment, event.currentTarget)}
                              aria-label={`${assignment.title}を削除`}
                              className="min-h-11 rounded-lg px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {formModal && (
        <AssignmentFormModal
          mode={formModal.mode}
          initialValues={formModal.mode === "edit" ? {
            title: formModal.assignment.title,
            subject: formModal.assignment.subject,
            dueDate: formModal.assignment.dueDate,
            priority: formModal.assignment.priority,
            status: formModal.assignment.status,
          } : undefined}
          onClose={closeFormModal}
          onSubmit={handleFormSubmit}
        />
      )}
      {assignmentToDelete && (
        <DeleteConfirmationModal
          assignmentTitle={assignmentToDelete.title}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
