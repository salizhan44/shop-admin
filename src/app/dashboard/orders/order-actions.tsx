"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  UI_DANGER_BUTTON_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
  UI_SECONDARY_BUTTON_CLASS,
  UI_TEXTAREA_CLASS,
  UI_LABEL_CLASS,
} from "@/lib/ui.shared";

export function OrderActions(props: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"confirm" | "reject" | null>(null);

  async function onConfirm() {
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
    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void onConfirm();
          }}
          disabled={pending !== null}
          className={UI_PRIMARY_BUTTON_CLASS}
        >
          {pending === "confirm" ? "Подтверждаем…" : "Подтвердить"}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen((current) => !current)}
          disabled={pending !== null}
          className={UI_DANGER_BUTTON_CLASS}
        >
          Отклонить
        </button>
      </div>
      {rejectOpen ? (
        <div className="flex flex-col gap-2">
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
              disabled={pending !== null}
              className={UI_DANGER_BUTTON_CLASS}
            >
              {pending === "reject" ? "Отклоняем…" : "Отклонить заказ"}
            </button>
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              disabled={pending !== null}
              className={UI_SECONDARY_BUTTON_CLASS}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
