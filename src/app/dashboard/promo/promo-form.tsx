"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type { ProductAdmin } from "@/lib/products.shared";
import {
  PROMO_CODE_KINDS,
  promoKindLabel,
  type PromoCodeKind,
} from "@/lib/promo.shared";

export function PromoForm(props: { products: ProductAdmin[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<PromoCodeKind>("PERCENT");
  const [percentOff, setPercentOff] = useState("10");
  const [amountSom, setAmountSom] = useState("200");
  const [freeProductId, setFreeProductId] = useState("");
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState("");
  const [maxPerCustomer, setMaxPerCustomer] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/staff/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          kind,
          percentOff,
          amountSom,
          freeProductId,
          maxTotalRedemptions,
          maxPerCustomer,
        }),
      });
      const data = (await response.json()) as ApiErrorBody | { promoCode: unknown };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось создать промокод");
        return;
      }
      setCode("");
      setKind("PERCENT");
      setPercentOff("10");
      setAmountSom("200");
      setFreeProductId("");
      setMaxTotalRedemptions("");
      setMaxPerCustomer("1");
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
        Код
        <input
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ROLA10"
          className="rounded border border-zinc-300 bg-white px-3 py-2 uppercase"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Что делает
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as PromoCodeKind)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        >
          {PROMO_CODE_KINDS.map((item) => (
            <option key={item} value={item}>
              {promoKindLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {kind === "PERCENT" ? (
        <label className="flex flex-col gap-1 text-sm">
          Процент скидки
          <input
            required
            value={percentOff}
            onChange={(event) => setPercentOff(event.target.value)}
            inputMode="numeric"
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          />
        </label>
      ) : null}
      {kind === "AMOUNT" ? (
        <label className="flex flex-col gap-1 text-sm">
          Скидка, сом
          <input
            required
            value={amountSom}
            onChange={(event) => setAmountSom(event.target.value)}
            inputMode="decimal"
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          />
        </label>
      ) : null}
      {kind === "FREE_PRODUCT" ? (
        <label className="flex flex-col gap-1 text-sm">
          Товар в подарок
          <select
            required
            value={freeProductId}
            onChange={(event) => setFreeProductId(event.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          >
            <option value="">Выберите товар</option>
            {props.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {kind === "FREE_DELIVERY" ? (
        <p className="text-sm text-zinc-600">
          Сейчас доставка без отдельной платы — код сохранится, скидка 0 сом.
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Всего применений на всех
        <input
          value={maxTotalRedemptions}
          onChange={(event) => setMaxTotalRedemptions(event.target.value)}
          placeholder="Пусто — без лимита, например 100"
          inputMode="numeric"
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Раз на одного клиента
        <input
          value={maxPerCustomer}
          onChange={(event) => setMaxPerCustomer(event.target.value)}
          inputMode="numeric"
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Создать промокод"}
      </button>
    </form>
  );
}
