"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  assignmentIdentity,
  assignmentInputToInsert,
  assignmentRowToAssignment,
  assignmentSelectColumns,
  assignmentStorageKey,
  formatJapaneseDateTime,
  formatJapaneseToday,
  getDeadlineNotification,
  getTokyoMonthDay,
  isAiPlan,
  isDueThisWeek,
  parseLegacyAssignments,
  sortByDueAt,
} from "../lib/assignments";
import type { Assignment, AssignmentInput } from "../types/assignment";
import { AssignmentFormModal } from "./assignment-form-modal";
import { AssignmentCard, PriorityBadge, StatusBadge } from "./assignment-card";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { AiPlanModal } from "./ai-plan-modal";

type FormModalState =
  | { mode: "add" }
  | { mode: "edit"; assignment: Assignment };

type DashboardProps = {
  userEmail: string;
  userId: string;
  initialAssignments: Assignment[];
  initialLoadError?: string;
};

export function Dashboard({
  userEmail,
  userId,
  initialAssignments,
  initialLoadError,
}: DashboardProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [assignments, setAssignments] = useState<Assignment[]>(() => sortByDueAt(initialAssignments));
  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [legacyAssignments, setLegacyAssignments] = useState<AssignmentInput[]>([]);
  const [isMigrationDismissed, setIsMigrationDismissed] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [generatingAiPlanId, setGeneratingAiPlanId] = useState<string | null>(null);
  const [aiPlanModalAssignmentId, setAiPlanModalAssignmentId] = useState<string | null>(null);
  const [aiPlanError, setAiPlanError] = useState<{ assignmentId: string; message: string } | null>(null);
  const [dataError, setDataError] = useState<string | null>(initialLoadError ?? null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const lastActionButtonRef = useRef<HTMLButtonElement | null>(null);
  const migrationOwnerRef = useRef(userId);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    migrationOwnerRef.current = userId;
    const timer = window.setTimeout(() => {
      const storedAssignments = parseLegacyAssignments(
        window.localStorage.getItem(assignmentStorageKey),
      );
      if (storedAssignments.length > 0) setLegacyAssignments(storedAssignments);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [userId]);

  const isDataOperationRunning =
    isSavingForm || Boolean(updatingStatusId) || isDeleting || isMigrating || Boolean(generatingAiPlanId);

  const restoreActionFocus = useCallback(() => {
    window.setTimeout(() => {
      const target = lastActionButtonRef.current;
      if (target?.isConnected) target.focus();
      else addButtonRef.current?.focus();
    }, 0);
  }, []);

  const clearMessages = () => {
    setDataError(null);
    setSuccessMessage(null);
  };

  const closeFormModal = useCallback(() => {
    if (isSavingForm) return;
    setFormModal(null);
    setFormSubmitError(null);
    restoreActionFocus();
  }, [isSavingForm, restoreActionFocus]);

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setAssignmentToDelete(null);
    setDeleteError(null);
    restoreActionFocus();
  }, [isDeleting, restoreActionFocus]);

  const closeAiPlanModal = useCallback(() => {
    setAiPlanModalAssignmentId(null);
    setAiPlanError(null);
    restoreActionFocus();
  }, [restoreActionFocus]);

  const fetchAssignments = useCallback(async (): Promise<Assignment[] | null> => {
    const { data, error } = await supabase
      .from("assignments")
      .select(assignmentSelectColumns)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) return null;
    return (data ?? []).map(assignmentRowToAssignment);
  }, [supabase]);

  const openAddModal = (trigger: HTMLButtonElement) => {
    if (isDataOperationRunning) return;
    lastActionButtonRef.current = trigger;
    setFormSubmitError(null);
    setFormModal({ mode: "add" });
  };

  const openEditModal = (assignment: Assignment, trigger: HTMLButtonElement) => {
    if (isDataOperationRunning) return;
    lastActionButtonRef.current = trigger;
    setFormSubmitError(null);
    setFormModal({ mode: "edit", assignment });
  };

  const openDeleteModal = (assignment: Assignment, trigger: HTMLButtonElement) => {
    if (isDataOperationRunning) return;
    lastActionButtonRef.current = trigger;
    setDeleteError(null);
    setAssignmentToDelete(assignment);
  };

  const handleFormSubmit = async (values: AssignmentInput) => {
    if (isSavingForm) return;
    setIsSavingForm(true);
    clearMessages();
    setFormSubmitError(null);

    try {
      if (formModal?.mode === "edit") {
        const { data, error } = await supabase
          .from("assignments")
          .update(assignmentInputToInsert(values))
          .eq("id", formModal.assignment.id)
          .select(assignmentSelectColumns)
          .single();

        if (error || !data) {
          const message = "課題を更新できませんでした。時間をおいてもう一度お試しください。";
          setFormSubmitError(message);
          setDataError(message);
          return;
        }

        const updatedAssignment = assignmentRowToAssignment(data);
        setAssignments((current) => sortByDueAt(current.map((assignment) => (
          assignment.id === updatedAssignment.id ? updatedAssignment : assignment
        ))));
      } else {
        const { data, error } = values.recurrence
          ? await supabase.rpc("create_recurring_assignment", {
              p_title: values.title,
              p_subject: values.subject,
              p_due_at: values.dueAt,
              p_priority: values.priority,
              p_status: values.status,
              p_due_weekday: values.recurrence.dueWeekday,
              p_due_time: values.recurrence.dueTime,
            })
          : await supabase
              .from("assignments")
              .insert(assignmentInputToInsert(values))
              .select(assignmentSelectColumns)
              .single();

        if (error || !data) {
          const message = "課題を追加できませんでした。時間をおいてもう一度お試しください。";
          setFormSubmitError(message);
          setDataError(message);
          return;
        }

        const addedAssignment = assignmentRowToAssignment(data);
        setAssignments((current) => sortByDueAt([...current, addedAssignment]));
      }

      setFormModal(null);
      setFormSubmitError(null);
      setDataError(null);
      restoreActionFocus();
    } catch {
      const message = "課題を保存できませんでした。通信状況を確認してもう一度お試しください。";
      setFormSubmitError(message);
      setDataError(message);
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleToggleStatus = async (target: Assignment) => {
    if (updatingStatusId || isDataOperationRunning) return;
    const nextStatus = target.status === "完了" ? "未着手" : "完了";
    setUpdatingStatusId(target.id);
    clearMessages();

    try {
      const { data, error } = await supabase
        .from("assignments")
        .update({ status: nextStatus })
        .eq("id", target.id)
        .select(assignmentSelectColumns)
        .single();

      if (error || !data) {
        setDataError("課題の状態を変更できませんでした。もう一度お試しください。");
        return;
      }

      const updatedAssignment = assignmentRowToAssignment(data);
      setAssignments((current) => sortByDueAt(current.map((assignment) => (
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      ))));
      setDataError(null);
    } catch {
      setDataError("課題の状態を変更できませんでした。通信状況を確認してください。");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete || isDeleting) return;
    setIsDeleting(true);
    clearMessages();
    setDeleteError(null);

    try {
      const { data, error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentToDelete.id)
        .select("id")
        .single();

      if (error || !data) {
        const message = "課題を削除できませんでした。時間をおいてもう一度お試しください。";
        setDeleteError(message);
        setDataError(message);
        return;
      }

      setAssignments((current) => current.filter((assignment) => assignment.id !== data.id));
      setAssignmentToDelete(null);
      setDeleteError(null);
      setDataError(null);
      window.setTimeout(() => addButtonRef.current?.focus(), 0);
    } catch {
      const message = "課題を削除できませんでした。通信状況を確認してください。";
      setDeleteError(message);
      setDataError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAiPlan = async (assignment: Assignment) => {
    if (generatingAiPlanId) return;
    setGeneratingAiPlanId(assignment.id);
    setAiPlanError(null);

    try {
      const response = await fetch(`/api/assignments/${encodeURIComponent(assignment.id)}/ai-plan`, {
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "AI計画を作成できませんでした。時間をおいてもう一度お試しください。";
        setAiPlanError({ assignmentId: assignment.id, message });
        return;
      }

      if (
        !payload || typeof payload !== "object" ||
        !("aiPlan" in payload) || !isAiPlan(payload.aiPlan) ||
        !("aiPlanGeneratedAt" in payload) || typeof payload.aiPlanGeneratedAt !== "string"
      ) {
        setAiPlanError({ assignmentId: assignment.id, message: "AI計画を正しく受け取れませんでした。もう一度お試しください。" });
        return;
      }

      const updatedAssignment = {
        ...assignment,
        aiPlan: payload.aiPlan,
        aiPlanGeneratedAt: payload.aiPlanGeneratedAt,
      };
      setAssignments((current) => current.map((item) => (
        item.id === assignment.id ? updatedAssignment : item
      )));
      setAiPlanModalAssignmentId(assignment.id);
      setAiPlanError(null);
    } catch {
      setAiPlanError({ assignmentId: assignment.id, message: "AI計画を作成できませんでした。通信状況を確認してください。" });
    } finally {
      setGeneratingAiPlanId(null);
    }
  };

  const startAiPlanGeneration = (assignment: Assignment, trigger: HTMLButtonElement) => {
    if (isDataOperationRunning) return;
    lastActionButtonRef.current = trigger;
    void handleGenerateAiPlan(assignment);
  };

  const openAiPlanModal = (assignment: Assignment, trigger: HTMLButtonElement) => {
    lastActionButtonRef.current = trigger;
    setAiPlanError(null);
    setAiPlanModalAssignmentId(assignment.id);
  };

  const handleMigration = async () => {
    if (isMigrating || legacyAssignments.length === 0) return;
    const migrationUserId = userId;
    setIsMigrating(true);
    clearMessages();

    try {
      const currentAssignments = await fetchAssignments();
      if (!currentAssignments || migrationOwnerRef.current !== migrationUserId) {
        setDataError("課題を移行できませんでした。時間をおいてもう一度お試しください。");
        return;
      }

      const existingIdentities = new Set(currentAssignments.map(assignmentIdentity));
      const assignmentsToMigrate = legacyAssignments.filter((assignment) => {
        const identity = assignmentIdentity(assignment);
        if (existingIdentities.has(identity)) return false;
        existingIdentities.add(identity);
        return true;
      });

      if (assignmentsToMigrate.length > 0) {
        const { error } = await supabase
          .from("assignments")
          .insert(assignmentsToMigrate.map(assignmentInputToInsert));

        if (error) {
          setDataError("課題を移行できませんでした。ブラウザ内の課題は保持されています。");
          return;
        }
      }

      const refreshedAssignments = await fetchAssignments();
      if (!refreshedAssignments || migrationOwnerRef.current !== migrationUserId) {
        setDataError("課題の移行結果を確認できませんでした。ブラウザ内の課題は保持されています。");
        return;
      }

      window.localStorage.removeItem(assignmentStorageKey);
      if (window.localStorage.getItem(assignmentStorageKey) !== null) {
        setDataError("課題は移行されましたが、ブラウザ内の旧データを削除できませんでした。");
        return;
      }

      setAssignments(sortByDueAt(refreshedAssignments));
      setLegacyAssignments([]);
      setDataError(null);
      setSuccessMessage("課題を移行しました");
    } catch {
      setDataError("課題を移行できませんでした。ブラウザ内の課題は保持されています。");
    } finally {
      setIsMigrating(false);
    }
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

  const sortedAssignments = useMemo(() => sortByDueAt(assignments), [assignments]);

  const deadlineNotifications = useMemo(
  () =>
    sortedAssignments
      .map((assignment) => ({
        assignment,
        notification: getDeadlineNotification(assignment, today),
      }))
      .filter(
        (
          item,
        ): item is {
          assignment: Assignment;
          notification: NonNullable<ReturnType<typeof getDeadlineNotification>>;
        } => item.notification !== null,
      ),
  [sortedAssignments, today],
);

  const aiPlanModalAssignment = assignments.find((assignment) => assignment.id === aiPlanModalAssignmentId) ?? null;
  const unfinishedCount = assignments.filter((assignment) => assignment.status !== "完了").length;
  const dueThisWeekCount = assignments.filter(
    (assignment) => assignment.status !== "完了" && isDueThisWeek(assignment.dueAt, today),
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
              disabled={isLoggingOut || isDataOperationRunning}
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
            disabled={isDataOperationRunning || isLoggingOut}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
          >
            <span aria-hidden="true" className="text-lg leading-none">＋</span>
            <span className="hidden sm:inline">課題を追加</span>
            <span className="sm:hidden">追加</span>
          </button>
          {logoutError && <p role="alert" className="order-4 mt-2 w-full text-right text-xs font-medium text-rose-600">{logoutError}</p>}
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

        <div aria-live="polite" className="mt-5 space-y-3">
          {dataError && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{dataError}</p>}
          {successMessage && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</p>}
        </div>

        {legacyAssignments.length > 0 && !isMigrationDismissed && (
          <section className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-labelledby="migration-heading">
            <div>
              <h2 id="migration-heading" className="text-sm font-extrabold text-indigo-950">以前の課題データがあります</h2>
              <p className="mt-1 text-sm leading-6 text-indigo-800">
                以前このブラウザに保存した課題が見つかりました。Supabaseへ移行すると、ログインした別の端末からも確認できます。
              </p>
            </div>
            <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 sm:mt-0 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsMigrationDismissed(true)}
                disabled={isMigrating}
                className="min-h-11 rounded-xl px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                後で
              </button>
              <button
                type="button"
                onClick={() => void handleMigration()}
                disabled={isDataOperationRunning}
                className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMigrating ? "移行中…" : "課題を移行する"}
              </button>
            </div>
          </section>
        )}

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

        {deadlineNotifications.length > 0 && (
          <section
            aria-labelledby="deadline-notifications-heading"
            className="mt-8"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="deadline-notifications-heading"
                  className="text-xl font-extrabold tracking-tight text-slate-900"
                >
                  🔔 締切通知
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  締切が近い課題や、期限を過ぎている課題があります。
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {deadlineNotifications.length}件
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {deadlineNotifications.map(({ assignment, notification }) => {
                const appearance =
                  notification.level === "overdue"
                    ? {
                        icon: "🚨",
                        border: "border-rose-200",
                        background: "bg-rose-50",
                        label: "text-rose-700",
                      }
                    : notification.level === "urgent"
                      ? {
                          icon: "⚠️",
                          border: "border-amber-200",
                          background: "bg-amber-50",
                          label: "text-amber-700",
                        }
                      : {
                          icon: "🔔",
                          border: "border-indigo-200",
                          background: "bg-indigo-50",
                          label: "text-indigo-700",
                        };

                return (
                  <article
                    key={assignment.id}
                    className={`rounded-2xl border p-4 ${appearance.border} ${appearance.background}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="text-xl leading-none"
                      >
                        {appearance.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-500">
                          {assignment.subject}
                        </p>

                        <h3 className="mt-1 font-extrabold text-slate-900">
                          {assignment.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className={`text-sm font-bold ${appearance.label}`}>
                            {notification.message}
                          </p>

                          <time
                            dateTime={assignment.dueAt}
                            className="text-xs font-semibold text-slate-500"
                          >
                            {formatJapaneseDateTime(assignment.dueAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <section aria-labelledby="focus-heading">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="focus-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今日取り組む課題</h2>
                <p className="mt-1 text-sm text-slate-500">期限切れ・完了済みを含め、締切が近い順に表示</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{sortedAssignments.length}件</span>
            </div>
            {sortedAssignments.length > 0 ? (
              <div className="space-y-3">
                {sortedAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggleStatus={(target) => void handleToggleStatus(target)}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onGenerateAiPlan={startAiPlanGeneration}
                    onViewAiPlan={openAiPlanModal}
                    isStatusUpdating={updatingStatusId === assignment.id}
                    isAiGenerating={generatingAiPlanId === assignment.id}
                    aiPlanError={aiPlanError?.assignmentId === assignment.id ? aiPlanError.message : null}
                    actionsDisabled={isDataOperationRunning}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
                <p className="font-bold text-slate-700">課題はまだ登録されていません</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">右上の「課題を追加」から最初の課題を登録しましょう</p>
              </div>
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <div className="mb-4">
              <h2 id="upcoming-heading" className="text-xl font-extrabold tracking-tight text-slate-900">今後の締切</h2>
              <p className="mt-1 text-sm text-slate-500">すべての課題を期限が近い順に表示</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.035)]">
              {sortedAssignments.length > 0 ? (
                <ol className="divide-y divide-slate-100">
                  {sortedAssignments.map((assignment) => {
                    const dueDate = getTokyoMonthDay(assignment.dueAt);
                    return (
                      <li key={assignment.id} className="p-5">
                        <div className="flex gap-4">
                          <div className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-slate-50 py-2 text-center">
                            <span className="text-[10px] font-bold tracking-wide text-slate-400">{dueDate.month}月</span>
                            <span className="text-lg font-extrabold leading-5 text-slate-800">{dueDate.day}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-indigo-600">{assignment.subject}</p>
                            <h3 className={`mt-1 text-sm font-bold leading-5 ${assignment.status === "完了" ? "text-slate-400 line-through decoration-2" : "text-slate-900"}`}>{assignment.title}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <time dateTime={assignment.dueAt} className="text-xs font-medium text-slate-500">締切：{formatJapaneseDateTime(assignment.dueAt)}</time>
                              <PriorityBadge priority={assignment.priority} />
                              <StatusBadge status={assignment.status} />
                            </div>
                            <div className="mt-2 flex gap-1">
                              <button
                                type="button"
                                onClick={(event) => openEditModal(assignment, event.currentTarget)}
                                disabled={isDataOperationRunning}
                                aria-label={`${assignment.title}を編集`}
                                className="min-h-11 rounded-lg px-3 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >編集</button>
                              <button
                                type="button"
                                onClick={(event) => openDeleteModal(assignment, event.currentTarget)}
                                disabled={isDataOperationRunning}
                                aria-label={`${assignment.title}を削除`}
                                className="min-h-11 rounded-lg px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >削除</button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="p-6 text-center text-sm text-slate-400">登録された締切はありません。</p>
              )}
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
            dueAt: formModal.assignment.dueAt,
            priority: formModal.assignment.priority,
            status: formModal.assignment.status,
          } : undefined}
          isSubmitting={isSavingForm}
          submitError={formSubmitError}
          onClose={closeFormModal}
          onSubmit={handleFormSubmit}
        />
      )}
      {assignmentToDelete && (
        <DeleteConfirmationModal
          assignmentTitle={assignmentToDelete.title}
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {aiPlanModalAssignment?.aiPlan && (
        <AiPlanModal
          assignment={aiPlanModalAssignment}
          isRegenerating={generatingAiPlanId === aiPlanModalAssignment.id}
          error={aiPlanError?.assignmentId === aiPlanModalAssignment.id ? aiPlanError.message : null}
          onClose={closeAiPlanModal}
          onRegenerate={() => void handleGenerateAiPlan(aiPlanModalAssignment)}
        />
      )}
    </main>
  );
}
