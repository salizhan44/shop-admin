"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function ProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {open ? "Скрыть" : "Добавить товар"}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={onSubmit}
          className="flex max-w-md flex-col gap-4 rounded-2xl bg-zinc-50/80 p-3.5 ring-1 ring-zinc-200/60"
        >
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Название
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none focus:ring-2 focus:ring-zinc-400/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Описание
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none focus:ring-2 focus:ring-zinc-400/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Цена, сом
            <input
              required
              inputMode="decimal"
              placeholder="199.90"
              value={priceSom}
              onChange={(event) => setPriceSom(event.target.value)}
              className="rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none focus:ring-2 focus:ring-zinc-400/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Остаток на складе, шт.
            <input
              required
              inputMode="numeric"
              placeholder="0"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              className="rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none focus:ring-2 focus:ring-zinc-400/50"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить товар"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
