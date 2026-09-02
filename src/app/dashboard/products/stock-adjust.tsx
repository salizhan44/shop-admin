"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

const SAVE_DEBOUNCE_MS = 450;

export function StockAdjust(props: {
  productId: string;
  initialStock: number;
}) {
  const router = useRouter();
  const [stockQuantity, setStockQuantity] = useState(String(props.initialStock));
  const [error, setError] = useState("");
  const lastSavedRef = useRef(props.initialStock);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setStockQuantity(String(props.initialStock));
    lastSavedRef.current = props.initialStock;
    setError("");
  }, [props.initialStock, props.productId]);

  useEffect(() => {
    const trimmed = stockQuantity.trim();
    if (trimmed === "") {
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      const timer = window.setTimeout(() => {
        setError("Остаток — целое число от 0");
      }, SAVE_DEBOUNCE_MS);
      return () => window.clearTimeout(timer);
    }

    if (parsed === lastSavedRef.current) {
      setError("");
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setError("");

      void (async () => {
        try {
          const response = await fetch(`/api/products/${props.productId}/stock`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stockQuantity: parsed }),
          });
          if (requestId !== requestIdRef.current) {
            return;
          }
          const data = (await response.json()) as
            | ApiErrorBody
            | { product: unknown };
          if (!response.ok) {
            setError(
              "error" in data ? data.error : "Не удалось сохранить остаток",
            );
            return;
          }
          lastSavedRef.current = parsed;
          router.refresh();
        } catch {
          if (requestId === requestIdRef.current) {
            setError("Нет связи с сервером");
          }
        }
      })();
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [stockQuantity, props.productId, router]);

  return (
    <div className="mt-2 flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm text-zinc-800">
        Остаток на складе
        <input
          inputMode="numeric"
          value={stockQuantity}
          onChange={(event) => setStockQuantity(event.target.value)}
          className="h-9 w-14 rounded border border-zinc-300 bg-white px-2 text-center text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
