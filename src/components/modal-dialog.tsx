"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

export function ModalDialog(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  useEffect(() => {
    if (!props.open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    function onWheel(event: WheelEvent) {
      const dialog = dialogRef.current;
      if (dialog?.contains(event.target as Node)) {
        return;
      }
      event.preventDefault();
      window.scrollBy(event.deltaX, event.deltaY);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [props.open]);

  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#061e3a]/45"
        aria-label="Закрыть"
        onClick={props.onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden ${UI_CARD_CLASS}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2
            id={titleId}
            className="truncate text-lg font-semibold tracking-tight text-zinc-900"
          >
            {props.title}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {props.children}
        </div>
      </div>
    </div>
  );
}
