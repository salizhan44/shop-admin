"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  ORDER_CONFIRMED_COLOR,
  UI_DANGER_BUTTON_CLASS,
  UI_LABEL_CLASS,
  UI_SECONDARY_BUTTON_CLASS,
  UI_TEXTAREA_CLASS,
} from "@/lib/ui.shared";
import { ModalDialog } from "@/components/modal-dialog";

export function OrderActions(props: {
  orderId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"confirm" | "reject" | null>(null);
  const busy = pending !== null;
  const inactive = props.disabled || busy;

  async function onConfirm() {
    if (inactive) {
      return;
    }
    setError("");
    setPending("confirm");
    try {
      const response = await fetch(`/api/orders/${props.orderId}/confirm`, {
        method: "POST",
      });
      const data = (await response.json()) as ApiErrorBody | { order: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось подтвердить заказ");
        return;
      }
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(null);
    }
  }

  async function onReject() {
    if (props.disabled || busy) {
      return;
    }
    setError("");
    setPending("reject");
    try {
      const response = await fetch(`/api/orders/${props.orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json()) as ApiErrorBody | { order: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось отклонить заказ");
        return;
      }
      setReason("");
      setRejectOpen(false);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Подтвердить"
          disabled={inactive}
          onClick={() => {
            void onConfirm();
          }}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
            inactive
              ? "bg-zinc-200 text-zinc-400"
              : "text-white hover:opacity-90"
          }`}
          style={
            inactive ? undefined : { backgroundColor: ORDER_CONFIRMED_COLOR }
          }
        >
          <CheckIcon />
        </button>
        <button
          type="button"
          aria-label="Отклонить"
          disabled={inactive}
          onClick={() => setRejectOpen(true)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
            inactive
              ? "bg-zinc-200 text-zinc-400"
              : "bg-red-600 text-white hover:opacity-90"
          }`}
        >
          <CrossIcon />
        </button>
      </div>
      {error ? <p className="max-w-40 text-right text-xs text-red-700">{error}</p> : null}

      <ModalDialog
        open={rejectOpen}
        title="Отклонить заказ"
        onClose={() => {
          if (!busy) {
            setRejectOpen(false);
          }
        }}
      >
        <div className="flex flex-col gap-3">
          <label className={UI_LABEL_CLASS}>
            Причина
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={UI_TEXTAREA_CLASS}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void onReject();
              }}
              disabled={busy}
              className={UI_DANGER_BUTTON_CLASS}
            >
              {pending === "reject" ? "Отклоняем…" : "Отклонить заказ"}
            </button>
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              disabled={busy}
              className={UI_SECONDARY_BUTTON_CLASS}
            >
              Отмена
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M5 5 15 15M15 5 5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
