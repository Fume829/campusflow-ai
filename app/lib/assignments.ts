import type { Database } from "@/lib/supabase/database.types";
import {
  priorities,
  statuses,
  type Assignment,
  type AiPlan,
  type AssignmentInput,
  type AssignmentRow,
} from "../types/assignment";

export const assignmentStorageKey = "campusflow-ai.assignments.v1";
export const assignmentSelectColumns =
  "id,title,subject,due_date,priority,status,created_at,updated_at,ai_plan,ai_plan_generated_at" as const;

type SelectedAssignmentRow = Omit<AssignmentRow, "user_id">;
type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];

export function assignmentRowToAssignment(row: SelectedAssignmentRow): Assignment {
  const aiPlan = isAiPlan(row.ai_plan) ? row.ai_plan : null;
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    aiPlan,
    aiPlanGeneratedAt: aiPlan && typeof row.ai_plan_generated_at === "string"
      ? row.ai_plan_generated_at
      : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(value, key));
}

export function isAiPlan(value: unknown): value is AiPlan {
  if (!isRecord(value) || !hasOnlyKeys(value, ["summary", "totalEstimatedMinutes", "steps", "tips"])) {
    return false;
  }
  if (
    typeof value.summary !== "string" || value.summary.trim().length === 0 ||
    !Number.isInteger(value.totalEstimatedMinutes) || Number(value.totalEstimatedMinutes) <= 0 ||
    !Array.isArray(value.steps) || value.steps.length < 3 || value.steps.length > 7 ||
    !Array.isArray(value.tips) || !value.tips.every((tip) => typeof tip === "string" && tip.trim().length > 0)
  ) {
    return false;
  }

  return value.steps.every((step) => {
    if (!isRecord(step) || !hasOnlyKeys(step, ["title", "description", "estimatedMinutes"])) return false;
    return typeof step.title === "string" && step.title.trim().length > 0 &&
      typeof step.description === "string" && step.description.trim().length > 0 &&
      Number.isInteger(step.estimatedMinutes) && Number(step.estimatedMinutes) > 0;
  });
}

export function assignmentInputToInsert(input: AssignmentInput): AssignmentInsert {
  return {
    title: input.title,
    subject: input.subject,
    due_date: input.dueDate,
    priority: input.priority,
    status: input.status,
  };
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isValidDateString(dateString: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function formatJapaneseDate(dateString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseLocalDate(dateString));
}

export function formatJapaneseToday(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function sortByDueDate(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => (
    a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt)
  ));
}

export function isDueThisWeek(dateString: string, today: Date): boolean {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + (6 - start.getDay()));
  const dueDate = parseLocalDate(dateString);

  return dueDate >= start && dueDate <= end;
}

export function isAssignmentInput(value: unknown): value is AssignmentInput {
  if (!value || typeof value !== "object") return false;

  const assignment = value as Record<string, unknown>;
  return (
    typeof assignment.title === "string" &&
    assignment.title.trim().length > 0 &&
    typeof assignment.subject === "string" &&
    assignment.subject.trim().length > 0 &&
    typeof assignment.dueDate === "string" &&
    isValidDateString(assignment.dueDate) &&
    priorities.includes(assignment.priority as (typeof priorities)[number]) &&
    statuses.includes(assignment.status as (typeof statuses)[number])
  );
}

export function parseLegacyAssignments(storedValue: string | null): AssignmentInput[] {
  if (!storedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(isAssignmentInput).map((assignment) => ({
      title: assignment.title.trim(),
      subject: assignment.subject.trim(),
      dueDate: assignment.dueDate,
      priority: assignment.priority,
      status: assignment.status,
    }));
  } catch {
    return [];
  }
}

export function assignmentIdentity(assignment: AssignmentInput): string {
  return JSON.stringify([
    assignment.title,
    assignment.subject,
    assignment.dueDate,
    assignment.priority,
    assignment.status,
  ]);
}
