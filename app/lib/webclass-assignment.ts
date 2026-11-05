
import type { AssignmentInput } from "../types/assignment";
import type { WebClassItem } from "./webclass-import";
import { tokyoLocalDateTimeToIso } from "./assignments";

export function createWebClassAssignmentInput(
  item: WebClassItem,
  courseName: string,
  dueDate: string
): AssignmentInput {
  if (!dueDate) {
    throw new Error("提出期限を入力してください。");
  }

  const dueAt = tokyoLocalDateTimeToIso(dueDate);

  if (!dueAt) {
    throw new Error("提出期限の形式が正しくありません。");
  }

  return {
    title: item.title,
    subject: courseName,
    dueAt,
    priority: "中",
    status: "未着手",
  };
}
