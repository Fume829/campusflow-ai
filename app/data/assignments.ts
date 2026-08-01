import type { Assignment } from "../types/assignment";

export const initialAssignments: Assignment[] = [
  {
    id: "sample-1",
    subject: "データベース論",
    title: "データベース演習レポート",
    dueDate: "2026-08-05",
    priority: "高",
    status: "未着手",
  },
  {
    id: "sample-2",
    subject: "人工知能概論",
    title: "AI基礎課題",
    dueDate: "2026-08-07",
    priority: "中",
    status: "進行中",
  },
  {
    id: "sample-3",
    subject: "情報システム工学実験",
    title: "ネットワーク実験レポート",
    dueDate: "2026-08-10",
    priority: "高",
    status: "未着手",
  },
];
