"use client";

import { useEffect, useRef, type MouseEvent } from "react";

type DeleteConfirmationModalProps = {
  assignmentTitle: string;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirmationModal({
  assignmentTitle,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting, onCancel]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isDeleting) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"
      >
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-xl font-bold text-rose-600" aria-hidden="true">!</div>
        <div className="mt-4 text-center">
          <h2 id="delete-dialog-title" className="text-xl font-extrabold text-slate-950">課題を削除しますか？</h2>
          <p id="delete-dialog-description" className="mt-2 text-sm leading-6 text-slate-500">
            「<span className="font-bold text-slate-700">{assignmentTitle}</span>」を削除します。この操作は取り消せません。
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-12 rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            aria-label={`${assignmentTitle}を削除する`}
            className="min-h-12 rounded-xl bg-rose-600 px-6 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "削除中…" : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );
}
