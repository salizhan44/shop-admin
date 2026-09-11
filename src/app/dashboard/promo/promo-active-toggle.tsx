"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { UI_SECONDARY_BUTTON_CLASS } from "@/lib/ui.shared";

export function PromoActiveToggle(props: {
  promoId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onToggle() {
    setError("");
    setPending(true);
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
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={pending}
        className={UI_SECONDARY_BUTTON_CLASS}
      >
        {pending
          ? "Сохраняем…"
          : props.isActive
            ? "Выключить"
            : "Включить"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
