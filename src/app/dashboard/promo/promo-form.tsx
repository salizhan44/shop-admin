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
import { SelectField } from "@/components/select-field";
import {
  UI_CARD_CLASS,
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
} from "@/lib/ui.shared";

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
    <form
      onSubmit={onSubmit}
      className={`flex max-w-md flex-col gap-4 ${UI_CARD_CLASS} p-5`}
    >
      <label className={UI_LABEL_CLASS}>
        Код
        <input
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ROLA10"
          className={`${UI_INPUT_CLASS} uppercase`}
        />
      </label>
      <label className={UI_LABEL_CLASS}>
        Скидка
        <SelectField
          value={kind}
          onChange={(value) => setKind(value as PromoCodeKind)}
          options={PROMO_CODE_KINDS.map((item) => ({
            value: item,
            label: promoKindLabel(item),
          }))}
        />
      </label>
      {kind === "PERCENT" ? (
        <label className={UI_LABEL_CLASS}>
          Процент
          <input
            required
            value={percentOff}
            onChange={(event) => setPercentOff(event.target.value)}
            inputMode="numeric"
            className={UI_INPUT_CLASS}
          />
        </label>
      ) : null}
      {kind === "AMOUNT" ? (
        <label className={UI_LABEL_CLASS}>
          Сумма, сом
          <input
            required
            value={amountSom}
            onChange={(event) => setAmountSom(event.target.value)}
            inputMode="decimal"
            className={UI_INPUT_CLASS}
          />
        </label>
      ) : null}
      {kind === "FREE_PRODUCT" ? (
        <label className={UI_LABEL_CLASS}>
          Товар в подарок
          <SelectField
            value={freeProductId}
            placeholder="Выберите товар"
            onChange={setFreeProductId}
            options={props.products.map((product) => ({
              value: product.id,
              label: product.name,
            }))}
          />
        </label>
      ) : null}
      <label className={UI_LABEL_CLASS}>
        Лимит на всех
        <input
          value={maxTotalRedemptions}
          onChange={(event) => setMaxTotalRedemptions(event.target.value)}
          placeholder="Без лимита"
          inputMode="numeric"
          className={UI_INPUT_CLASS}
        />
      </label>
      <label className={UI_LABEL_CLASS}>
        На одного клиента
        <input
          value={maxPerCustomer}
          onChange={(event) => setMaxPerCustomer(event.target.value)}
          inputMode="numeric"
          className={UI_INPUT_CLASS}
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={UI_PRIMARY_BUTTON_CLASS}
      >
        {pending ? "Сохраняем…" : "Создать"}
      </button>
    </form>
  );
}
