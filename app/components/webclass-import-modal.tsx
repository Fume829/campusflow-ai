
"use client";

import { useState } from "react";
import type { AssignmentInput } from "../types/assignment";
import { createWebClassAssignmentInput } from "../lib/webclass-assignment";
import {
  extractWebClassAssignments,
  parseWebClassImport,
  type WebClassItem,
} from "../lib/webclass-import";

type WebClassImportModalProps = {
  onClose: () => void;
  onImport: (assignments: AssignmentInput[]) => void;
  isImporting: boolean;
};

export function WebClassImportModal({
  onClose,
  onImport,
  isImporting,
}: WebClassImportModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [candidates, setCandidates] = useState<WebClassItem[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [courseName, setCourseName] = useState("");
  const [dueDates, setDueDates] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // JSONを解析して課題候補を抽出する
  const handlePreview = () => {
    setError(null);
    setCandidates([]);
    setCourseName("");
    setSelectedIndexes([]);
    setDueDates({});

    try {
      const data = parseWebClassImport(jsonText);
      const assignments = extractWebClassAssignments(data);

      setCourseName(data.courseName);
      setCandidates(assignments);

      // 初期状態ではすべての課題候補を選択する
      setSelectedIndexes(assignments.map((_, index) => index));
    } catch {
      setError("JSONを読み込めませんでした。データ形式を確認してください。");
    }
  };

  // チェックボックスの選択状態を切り替える
  const toggleSelection = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter((selected) => selected !== index)
        : [...current, index]
    );
  };

  const handleImport = () => {
    if (isImporting) return;

    setError(null);

    try {
      const selectedAssignments = candidates
        .filter((_, index) => selectedIndexes.includes(index))
        .map((item) => {
          const index = candidates.indexOf(item);

          return createWebClassAssignmentInput(
            item,
            courseName,
            dueDates[index] ?? ""
          );
        });

      if (selectedAssignments.length === 0) {
        setError("取り込む課題を選択してください。");
        return;
      }

      onImport(selectedAssignments);
    } catch {
      setError("選択した課題の提出期限をすべて入力してください。");
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="webclass-import-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        {/* タイトルと閉じるボタン */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="webclass-import-title"
            className="text-xl font-bold text-slate-900"
          >
            WebClassから課題を取り込む
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            閉じる
          </button>
        </div>

        {/* JSON入力欄 */}
        <p className="mb-4 text-sm text-slate-600">
          WebClassから取得したJSONデータを貼り付けてください。
        </p>

        <label
          htmlFor="webclass-json"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          WebClassのJSONデータ
        </label>

        <textarea
          id="webclass-json"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          disabled={isImporting}
          placeholder="ここにJSONデータを貼り付けてください"
          rows={10}
          className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* エラーメッセージ */}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 課題候補一覧 */}
        {candidates.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-indigo-700">
              授業名：{courseName}
            </p>

            <h3 className="mb-3 text-base font-bold text-slate-900">
              課題候補（{candidates.length}件）
            </h3>

            <div className="max-h-64 space-y-3 overflow-y-auto">
              {candidates.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndexes.includes(index)}
                    onChange={() => toggleSelection(index)}
                    disabled={isImporting}
                    className="mt-1 h-4 w-4 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      種類：{item.type}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      利用可能期間：{item.availability || "記載なし"}
                    </p>
                    <div className="mt-3">
                      <span className="mb-1 block text-sm font-medium text-slate-700">
                        提出期限
                      </span>

                      <input
                        type="datetime-local"
                        value={dueDates[index] ?? ""}
                        onChange={(event) =>
                          setDueDates((current) => ({
                            ...current,
                            [index]: event.target.value,
                          }))
                        }
                        onClick={(event) => event.stopPropagation()}
                        disabled={isImporting}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700">
              選択中：{selectedIndexes.length}件
            </p>

            <p className="mt-3 text-xs text-amber-700">
              ※利用可能期間の終了日時が、実際の提出期限とは限りません。
            </p>
          </div>
        )}

        {/* JSON解析ボタン */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!jsonText.trim() || isImporting}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            課題候補を確認
          </button>

          {candidates.length > 0 && (
            <button
              type="button"
              onClick={handleImport}
              disabled={selectedIndexes.length === 0 || isImporting}
              className="ml-3 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting
                ? "登録中..."
                : `選択した課題を登録（${selectedIndexes.length}件）`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
