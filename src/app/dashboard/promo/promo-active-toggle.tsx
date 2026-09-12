"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function PromoActiveToggle(props: {
  promoId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"toggle" | "delete" | null>(null);
  const [error, setError] = useState("");
  const busy = pending !== null;

  async function onToggle() {
    setError("");
    setPending("toggle");
    try {
      const response = await fetch(`/api/staff/promo-codes/${props.promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !props.isActive }),
      });
      const data = (await response.json()) as ApiErrorBody | { promoCode: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось изменить");
        return;
      }
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(null);
    }
  }

  async function onDelete() {
    setError("");
    setPending("delete");
    try {
      const response = await fetch(`/api/staff/promo-codes/${props.promoId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as ApiErrorBody | { ok: true };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось удалить");
        return;
      }
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void onToggle()}
          disabled={busy}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-zinc-50 disabled:opacity-60 ${
            props.isActive
              ? "text-zinc-700 hover:text-zinc-900"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
          aria-label={props.isActive ? "Приостановить" : "Включить"}
          title={props.isActive ? "Приостановить" : "Включить"}
        >
          <PauseIcon />
        </button>
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={busy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          aria-label="Удалить"
          title="Удалить"
        >
          <CrossIcon />
        </button>
      </div>
      {error ? <p className="max-w-40 text-right text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <rect x="5.5" y="4" width="3" height="12" rx="0.8" />
      <rect x="11.5" y="4" width="3" height="12" rx="0.8" />
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
