export type AssignmentPriority = "高" | "中" | "低";
export type AssignmentStatusValue = "未着手" | "進行中" | "完了";
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
  ai_plan: Json | null;
  ai_plan_generated_at: string | null;
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
  ai_plan?: never;
  ai_plan_generated_at?: never;
};

type AssignmentUpdate = {
  id?: never;
  user_id?: never;
  title?: string;
  subject?: string;
  due_date?: string;
  priority?: AssignmentPriority;
  status?: AssignmentStatusValue;
  created_at?: never;
  updated_at?: never;
  ai_plan?: Json | null;
  ai_plan_generated_at?: string | null;
};

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
