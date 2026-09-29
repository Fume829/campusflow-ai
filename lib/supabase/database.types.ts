export type AssignmentPriority = "高" | "中" | "低";
export type AssignmentStatusValue = "未着手" | "進行中" | "完了";
export type AssignmentFrequency = "weekly";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type AssignmentTemplateRow = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  frequency: AssignmentFrequency;
  due_weekday: number;
  due_time: string;
  priority: AssignmentPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AssignmentTemplateInsert = {
  id?: never;
  user_id?: never;
  title: string;
  subject: string;
  frequency?: AssignmentFrequency;
  due_weekday: number;
  due_time: string;
  priority?: AssignmentPriority;
  is_active?: boolean;
  created_at?: never;
  updated_at?: never;
};

type AssignmentTemplateUpdate = {
  id?: never;
  user_id?: never;
  title?: string;
  subject?: string;
  frequency?: AssignmentFrequency;
  due_weekday?: number;
  due_time?: string;
  priority?: AssignmentPriority;
  is_active?: boolean;
  created_at?: never;
  updated_at?: never;
};

export type AssignmentRow = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  due_date: string;
  due_at: string;
  priority: AssignmentPriority;
  status: AssignmentStatusValue;
  created_at: string;
  updated_at: string;
  ai_plan: Json | null;
  ai_plan_generated_at: string | null;
  template_id: string | null;
};

type AssignmentInsert = {
  id?: never;
  user_id?: never;
  title: string;
  subject: string;
  due_date: string;
  due_at: string;
  priority: AssignmentPriority;
  status: AssignmentStatusValue;
  created_at?: never;
  updated_at?: never;
  ai_plan?: never;
  ai_plan_generated_at?: never;
  template_id?: string | null;
};

type AssignmentUpdate = {
  id?: never;
  user_id?: never;
  title?: string;
  subject?: string;
  due_date?: string;
  due_at?: string;
  priority?: AssignmentPriority;
  status?: AssignmentStatusValue;
  created_at?: never;
  updated_at?: never;
  ai_plan?: Json | null;
  ai_plan_generated_at?: string | null;
  template_id?: string | null;
};

export type Database = {
  public: {
    Tables: {
      assignment_templates: {
        Row: AssignmentTemplateRow;
        Insert: AssignmentTemplateInsert;
        Update: AssignmentTemplateUpdate;
        Relationships: [];
      };
      assignments: {
        Row: AssignmentRow;
        Insert: AssignmentInsert;
        Update: AssignmentUpdate;
        Relationships: [
          {
            foreignKeyName: "assignments_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "assignment_templates";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_recurring_assignment: {
        Args: {
          p_due_at: string;
          p_due_time: string;
          p_due_weekday: number;
          p_priority: AssignmentPriority;
          p_status: AssignmentStatusValue;
          p_subject: string;
          p_title: string;
        };
        Returns: AssignmentRow;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};