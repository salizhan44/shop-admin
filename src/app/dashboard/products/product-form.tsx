"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function ProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceSom, setPriceSom] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, priceSom, stockQuantity }),
      });
      const data = (await response.json()) as ApiErrorBody | { product: unknown };

      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось сохранить товар");
        return;
      }

      setName("");
      setDescription("");
      setPriceSom("");
      setStockQuantity("0");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Название
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Описание
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-20 rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Цена, сом
        <input
          required
          inputMode="decimal"
          placeholder="199.90"
          value={priceSom}
          onChange={(event) => setPriceSom(event.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Остаток на складе, шт.
        <input
          required
          inputMode="numeric"
          placeholder="0"
          value={stockQuantity}
          onChange={(event) => setStockQuantity(event.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Добавить товар"}
      </button>
    </form>
  );
}
