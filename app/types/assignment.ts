import type {
  AssignmentPriority,
  AssignmentRow,
  AssignmentStatusValue,
} from "@/lib/supabase/database.types";

export const priorities = ["高", "中", "低"] as const satisfies readonly AssignmentPriority[];
export const statuses = ["未着手", "進行中", "完了"] as const satisfies readonly AssignmentStatusValue[];

export type Priority = AssignmentPriority;
export type AssignmentStatus = AssignmentStatusValue;
export type { AssignmentRow };

export type AiPlanStep = {
  title: string;
  description: string;
  estimatedMinutes: number;
};

export type AiPlan = {
  summary: string;
  totalEstimatedMinutes: number;
  steps: AiPlanStep[];
  tips: string[];
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueAt: string;
  priority: Priority;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  aiPlan: AiPlan | null;
  aiPlanGeneratedAt: string | null;
};

export type AssignmentInput = Pick<
  Assignment,
  "title" | "subject" | "dueAt" | "priority" | "status"
> & {
  recurrence?: {
    frequency: "weekly";
    dueWeekday: number;
    dueTime: string;
  };
};
