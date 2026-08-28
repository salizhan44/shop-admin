"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function TicketActions(props: { ticketId: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onClose() {
    setError("");
    setPending(true);
    try {
      const response = await fetch(
        `/api/support/tickets/${props.ticketId}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply }),
        },
      );
      const data = (await response.json()) as ApiErrorBody | { ticket: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось закрыть обращение");
        return;
      }
      setReply("");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3">
      <label className="flex flex-col gap-1 text-sm">
        Ответ клиенту
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="min-h-20 rounded border border-zinc-300 bg-white px-3 py-2"
          placeholder="Напишите ответ и закройте обращение"
        />
      </label>
      <button
        type="button"
        onClick={onClose}
        disabled={pending}
        className="self-start rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Закрываем…" : "Ответить и закрыть"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
