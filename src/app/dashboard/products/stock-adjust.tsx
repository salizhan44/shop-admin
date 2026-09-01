"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function StockAdjust(props: {
  productId: string;
  initialStock: number;
}) {
  const router = useRouter();
  const [stockQuantity, setStockQuantity] = useState(String(props.initialStock));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSave() {
    setError("");
    setPending(true);
    try {
      const parsed = Number(stockQuantity.trim());
      if (!Number.isInteger(parsed) || parsed < 0) {
        setError("Остаток — целое число от 0");
        return;
      }
      const response = await fetch(`/api/products/${props.productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: parsed }),
      });
      const data = (await response.json()) as ApiErrorBody | { product: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось сохранить остаток");
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
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Остаток на складе
        <input
          inputMode="numeric"
          value={stockQuantity}
          onChange={(event) => setStockQuantity(event.target.value)}
          className="w-28 rounded border border-zinc-300 bg-white px-3 py-1.5"
        />
      </label>
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Обновить"}
      </button>
      {error ? <p className="w-full text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
