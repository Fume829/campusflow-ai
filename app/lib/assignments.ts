import { priorities, statuses, type Assignment } from "../types/assignment";

export const assignmentStorageKey = "campusflow-ai.assignments.v1";

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
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
  return [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function isDueThisWeek(dateString: string, today: Date): boolean {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + (6 - start.getDay()));
  const dueDate = parseLocalDate(dateString);

  return dueDate >= start && dueDate <= end;
}

export function isAssignment(value: unknown): value is Assignment {
  if (!value || typeof value !== "object") return false;

  const assignment = value as Record<string, unknown>;
  return (
    typeof assignment.id === "string" &&
    typeof assignment.subject === "string" &&
    typeof assignment.title === "string" &&
    typeof assignment.dueDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(assignment.dueDate) &&
    priorities.includes(assignment.priority as (typeof priorities)[number]) &&
    statuses.includes(assignment.status as (typeof statuses)[number])
  );
}
