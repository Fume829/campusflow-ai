export const priorities = ["高", "中", "低"] as const;
export const statuses = ["未着手", "進行中", "完了"] as const;

export type Priority = (typeof priorities)[number];
export type AssignmentStatus = (typeof statuses)[number];

export type Assignment = {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  priority: Priority;
  status: AssignmentStatus;
};

export type AssignmentFormValues = Omit<Assignment, "id">;
