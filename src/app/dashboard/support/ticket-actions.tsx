"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  UI_LABEL_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
  UI_TEXTAREA_CLASS,
} from "@/lib/ui.shared";

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
    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
      <label className={UI_LABEL_CLASS}>
        Ответ
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className={UI_TEXTAREA_CLASS}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          void onClose();
        }}
        disabled={pending}
        className={`self-start ${UI_PRIMARY_BUTTON_CLASS}`}
      >
        {pending ? "Закрываем…" : "Ответить и закрыть"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
