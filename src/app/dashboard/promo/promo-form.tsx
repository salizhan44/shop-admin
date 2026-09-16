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
import { ModalDialog } from "@/components/modal-dialog";
import {
  ADMIN_MENU_BG,
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
} from "@/lib/ui.shared";

export function PromoForm(props: { products: ProductAdmin[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<PromoCodeKind>("PERCENT");
  const [percentOff, setPercentOff] = useState("10");
  const [amountSom, setAmountSom] = useState("200");
  const [freeProductId, setFreeProductId] = useState("");
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState("");
  const [maxPerCustomer, setMaxPerCustomer] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function resetForm() {
    setCode("");
    setKind("PERCENT");
    setPercentOff("10");
    setAmountSom("200");
    setFreeProductId("");
    setMaxTotalRedemptions("");
    setMaxPerCustomer("1");
    setError("");
  }

  function onClose() {
    if (pending) {
      return;
    }
    setOpen(false);
    resetForm();
  }

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
      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: ADMIN_MENU_BG }}
        >
          Добавить
        </button>
      </div>
      <ModalDialog open={open} title="Новый промокод" onClose={onClose}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className={UI_LABEL_CLASS}>
            Код
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
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
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: ADMIN_MENU_BG }}
          >
            {pending ? "Сохраняем…" : "Создать"}
          </button>
        </form>
      </ModalDialog>
    </>
  );
}
