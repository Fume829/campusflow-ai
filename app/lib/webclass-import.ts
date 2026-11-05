// WebClassから取得した教材1件分の情報
export type WebClassItem = {
  title: string;
  type: string;
  availability: string;
};

// WebClassの授業1件分の情報
export type WebClassImportData = {
  courseId: string;
  courseName: string;
  items: WebClassItem[];
};

// 課題として取り込む教材の種類
const assignmentTypes = [
  "レポート",
  "自習",
  "試験",
  "一問一答",
];

// 教材が課題候補かどうかを判定する
export function isWebClassAssignment(item: WebClassItem): boolean {
  return assignmentTypes.some((type) =>
    item.type.startsWith(type)
  );
}

// WebClassの教材一覧から課題候補だけを抽出する
export function extractWebClassAssignments(
  data: WebClassImportData
): WebClassItem[] {
  return data.items.filter(isWebClassAssignment);
}

// WebClassからコピーしたJSONを読み込む
export function parseWebClassImport(
  jsonText: string
): WebClassImportData {
  const data: unknown = JSON.parse(jsonText);

  if (
    typeof data !== "object" ||
    data === null ||
    !("courseId" in data) ||
    typeof data.courseId !== "string" ||
    !("courseName" in data) ||
    typeof data.courseName !== "string" ||
    !("items" in data) ||
    !Array.isArray(data.items)
  ) {
    throw new Error("WebClassのデータ形式が正しくありません。");
  }

  const validItems = data.items.every(
    (item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      "title" in item &&
      typeof item.title === "string" &&
      "type" in item &&
      typeof item.type === "string" &&
      "availability" in item &&
      typeof item.availability === "string"
  );

  if (!validItems) {
    throw new Error("WebClassの教材データが正しくありません。");
  }

  return data as WebClassImportData;
}