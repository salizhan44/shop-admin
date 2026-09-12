"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { UI_DANGER_BUTTON_CLASS } from "@/lib/ui.shared";

export function ProductDeleteButton(props: {
  productId: string;
  productName: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Удалить «${props.productName}»? Заказы с этим товаром сохранятся.`,
    );
    if (!ok) {
      return;
    }

    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/products/${props.productId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as
        | ApiErrorBody
        | { product: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось удалить товар");
        return;
      }
      props.onDeleted?.();
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
        onClick={() => {
          void onDelete();
        }}
        disabled={pending}
        className={`h-9 ${UI_DANGER_BUTTON_CLASS}`}
      >
        {pending ? "Удаляем…" : "Удалить"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
