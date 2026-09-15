export const PRODUCT_DISCOUNT_KINDS = ["none", "percent", "amount"] as const;

export type ProductDiscountKind = (typeof PRODUCT_DISCOUNT_KINDS)[number];

export const PRODUCT_DISCOUNT_PERCENT_MIN = 1;
export const PRODUCT_DISCOUNT_PERCENT_MAX = 70;

export type ProductDiscountFields = {
  priceCents: number;
  discountPercent: number | null;
  discountAmountCents: number | null;
};

export function productDiscountKindLabel(kind: ProductDiscountKind): string {
  switch (kind) {
    case "none":
      return "Без скидки";
    case "percent":
      return "Процент";
    case "amount":
      return "Сумма, сом";
  }
}

export function isProductDiscountKind(
  value: unknown,
): value is ProductDiscountKind {
  return (
    typeof value === "string" &&
    (PRODUCT_DISCOUNT_KINDS as readonly string[]).includes(value)
  );
}

export function productDiscountKindFromFields(
  input: Pick<ProductDiscountFields, "discountPercent" | "discountAmountCents">,
): ProductDiscountKind {
  if (input.discountPercent != null && input.discountPercent > 0) {
    return "percent";
  }
  if (input.discountAmountCents != null && input.discountAmountCents > 0) {
    return "amount";
  }
  return "none";
}

/** Цена после скидки, в тыйынах. Без скидки совпадает с обычной. */
export function salePriceCents(input: ProductDiscountFields): number {
  const price = Math.max(0, input.priceCents);
  if (price <= 0) {
    return 0;
  }
  let sale = price;
  if (input.discountPercent != null && input.discountPercent > 0) {
    const percent = Math.min(
      PRODUCT_DISCOUNT_PERCENT_MAX,
      Math.max(PRODUCT_DISCOUNT_PERCENT_MIN, input.discountPercent),
    );
    sale = Math.floor((price * (100 - percent)) / 100);
  } else if (input.discountAmountCents != null && input.discountAmountCents > 0) {
    sale = price - input.discountAmountCents;
  }
  if (sale >= price) {
    return price;
  }
  return Math.max(100, sale);
}

export function compareAtCents(input: ProductDiscountFields): number | null {
  const sale = salePriceCents(input);
  return sale < input.priceCents ? input.priceCents : null;
}

export function productDiscountLabel(input: ProductDiscountFields): string | null {
  if (salePriceCents(input) >= input.priceCents) {
    return null;
  }
  if (input.discountPercent != null && input.discountPercent > 0) {
    return `−${input.discountPercent}%`;
  }
  return "Скидка";
}

export function parseProductDiscount(input: {
  kind: string;
  percentText: string;
  amountSom: string;
  priceCents: number;
}):
  | { discountPercent: number | null; discountAmountCents: number | null }
  | { error: string } {
  const kind = input.kind.trim() || "none";
  if (!isProductDiscountKind(kind)) {
    return { error: "Выберите тип скидки" };
  }
  if (kind === "none") {
    return { discountPercent: null, discountAmountCents: null };
  }
  if (kind === "percent") {
    const trimmed = input.percentText.trim();
    if (!/^\d+$/.test(trimmed)) {
      return { error: "Процент скидки — целое число" };
    }
    const percent = Number(trimmed);
    if (
      percent < PRODUCT_DISCOUNT_PERCENT_MIN ||
      percent > PRODUCT_DISCOUNT_PERCENT_MAX
    ) {
      return {
        error: `Скидка от ${PRODUCT_DISCOUNT_PERCENT_MIN} до ${PRODUCT_DISCOUNT_PERCENT_MAX}%`,
      };
    }
    const draft: ProductDiscountFields = {
      priceCents: input.priceCents,
      discountPercent: percent,
      discountAmountCents: null,
    };
    if (salePriceCents(draft) >= input.priceCents) {
      return { error: "Скидка должна снижать цену" };
    }
    return { discountPercent: percent, discountAmountCents: null };
  }

  const normalized = input.amountSom.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { error: "Сумма скидки — число, например 20 или 15.50" };
  }
  const amountCents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Сумма скидки больше 0" };
  }
  const draft: ProductDiscountFields = {
    priceCents: input.priceCents,
    discountPercent: null,
    discountAmountCents: amountCents,
  };
  if (salePriceCents(draft) >= input.priceCents) {
    return { error: "Скидка должна быть меньше цены товара" };
  }
  return { discountPercent: null, discountAmountCents: amountCents };
}
