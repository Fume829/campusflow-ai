export type AssignmentPriority = "高" | "中" | "低";
export type AssignmentStatusValue = "未着手" | "進行中" | "完了";

export type AssignmentRow = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  due_date: string;
  priority: AssignmentPriority;
  status: AssignmentStatusValue;
  created_at: string;
  updated_at: string;
};

type AssignmentInsert = {
  id?: never;
  user_id?: never;
  title: string;
  subject: string;
  due_date: string;
  priority: AssignmentPriority;
  status: AssignmentStatusValue;
  created_at?: never;
  updated_at?: never;
};

type AssignmentUpdate = Partial<AssignmentInsert>;

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: AssignmentRow;
        Insert: AssignmentInsert;
        Update: AssignmentUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
