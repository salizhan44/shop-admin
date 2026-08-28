"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function OrderActions(props: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
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
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending !== null}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
        >
          {pending === "confirm" ? "Подтверждаем…" : "Подтвердить"}
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Причина отклонения
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-16 rounded border border-zinc-300 bg-white px-3 py-2"
          placeholder="Например: товара нет на складе"
        />
      </label>
      <button
        type="button"
        onClick={onReject}
        disabled={pending !== null}
        className="self-start rounded border border-red-300 px-3 py-1.5 text-sm text-red-800 disabled:opacity-60"
      >
        {pending === "reject" ? "Отклоняем…" : "Отклонить"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
