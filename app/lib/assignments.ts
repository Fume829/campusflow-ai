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
export const assignmentTimeZone = "Asia/Tokyo";
export const assignmentSelectColumns =
  "id,title,subject,due_date,due_at,priority,status,created_at,updated_at,ai_plan,ai_plan_generated_at,template_id" as const;

type SelectedAssignmentRow = Omit<AssignmentRow, "user_id">;
type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];

export function assignmentRowToAssignment(row: SelectedAssignmentRow): Assignment {
  const aiPlan = isAiPlan(row.ai_plan) ? row.ai_plan : null;
  const dueAt = resolveAssignmentDueAt(row.due_at, row.due_date);
  if (!dueAt) throw new Error("課題の締切日時が正しくありません。");

  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    dueAt,
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
  const dueDate = dueAtToTokyoDate(input.dueAt);
  if (!dueDate) throw new Error("課題の締切日時が正しくありません。");

  return {
    title: input.title,
    subject: input.subject,
    due_date: dueDate,
    due_at: input.dueAt,
    priority: input.priority,
    status: input.status,
  };
}

export function isValidDateString(dateString: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizeIsoDateTime(value: string | null): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function getTokyoDateTimeParts(value: string | Date): Record<string, string> | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: assignmentTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function tokyoLocalDateTimeToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const calendarCheck = new Date(0);
  calendarCheck.setUTCFullYear(year, month - 1, day);
  calendarCheck.setUTCHours(hour, minute, 0, 0);

  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    calendarCheck.getUTCHours() !== hour ||
    calendarCheck.getUTCMinutes() !== minute
  ) {
    return null;
  }

  const dueAt = normalizeIsoDateTime(`${value}:00+09:00`);
  return dueAt && dueAtToTokyoInputValue(dueAt) === value ? dueAt : null;
}

export function dueAtToTokyoInputValue(dueAt: string): string {
  const parts = getTokyoDateTimeParts(dueAt);
  if (!parts?.year || !parts.month || !parts.day || !parts.hour || !parts.minute) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function dueAtToTokyoDate(dueAt: string): string | null {
  const inputValue = dueAtToTokyoInputValue(dueAt);
  return inputValue ? inputValue.slice(0, 10) : null;
}

export function formatDueAtJapan(dueAt: string): string {
  return dueAtToTokyoInputValue(dueAt).replace("T", " ");
}

export function resolveAssignmentDueAt(dueAt: string | null, dueDate: string): string | null {
  return normalizeIsoDateTime(dueAt) || (
    isValidDateString(dueDate)
      ? tokyoLocalDateTimeToIso(`${dueDate}T23:59`)
      : null
  );
}

export function formatJapaneseDateTime(dueAt: string): string {
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return "締切日時不明";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: assignmentTimeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function getTokyoMonthDay(dueAt: string): { month: string; day: string } {
  const parts = getTokyoDateTimeParts(dueAt);
  return {
    month: parts?.month ? String(Number(parts.month)) : "-",
    day: parts?.day ? String(Number(parts.day)) : "-",
  };
}

export function formatJapaneseToday(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: assignmentTimeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function sortByDueAt(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => (
    Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.createdAt.localeCompare(b.createdAt)
  ));
}

function getUtcCalendarDay(parts: Record<string, string>): number | null {
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(0, 0, 0, 0);
  return value.getTime();
}

export function isDueThisWeek(dueAt: string, today: Date): boolean {
  const todayParts = getTokyoDateTimeParts(today);
  const dueParts = getTokyoDateTimeParts(dueAt);
  if (!todayParts || !dueParts) return false;

  const start = getUtcCalendarDay(todayParts);
  const dueDay = getUtcCalendarDay(dueParts);
  if (start === null || dueDay === null) return false;

  const daysUntilSunday = (7 - new Date(start).getUTCDay()) % 7;
  const end = start + daysUntilSunday * 24 * 60 * 60 * 1000;

  return dueDay >= start && dueDay <= end;
}

export function isAssignmentInput(value: unknown): value is AssignmentInput {
  if (!value || typeof value !== "object") return false;

  const assignment = value as Record<string, unknown>;
  return (
    typeof assignment.title === "string" &&
    assignment.title.trim().length > 0 &&
    typeof assignment.subject === "string" &&
    assignment.subject.trim().length > 0 &&
    typeof assignment.dueAt === "string" &&
    normalizeIsoDateTime(assignment.dueAt) !== null &&
    priorities.includes(assignment.priority as (typeof priorities)[number]) &&
    statuses.includes(assignment.status as (typeof statuses)[number])
  );
}

export function parseLegacyAssignments(storedValue: string | null): AssignmentInput[] {
  if (!storedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.flatMap((value) => {
      if (!isRecord(value)) return [];
      const dueDate = typeof value.dueDate === "string" ? value.dueDate : "";
      const dueAt = isValidDateString(dueDate)
        ? tokyoLocalDateTimeToIso(`${dueDate}T23:59`)
        : null;

      if (
        typeof value.title !== "string" || value.title.trim().length === 0 ||
        typeof value.subject !== "string" || value.subject.trim().length === 0 ||
        !dueAt ||
        !priorities.includes(value.priority as (typeof priorities)[number]) ||
        !statuses.includes(value.status as (typeof statuses)[number])
      ) {
        return [];
      }

      return [{
        title: value.title.trim(),
        subject: value.subject.trim(),
        dueAt,
        priority: value.priority as AssignmentInput["priority"],
        status: value.status as AssignmentInput["status"],
      }];
    });
  } catch {
    return [];
  }
}

export function assignmentIdentity(assignment: AssignmentInput): string {
  return JSON.stringify([
    assignment.title,
    assignment.subject,
    assignment.dueAt,
    assignment.priority,
    assignment.status,
  ]);
}
