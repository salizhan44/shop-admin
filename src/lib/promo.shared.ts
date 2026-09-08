export const PROMO_CODE_KINDS = [
  "PERCENT",
  "AMOUNT",
  "FREE_DELIVERY",
  "FREE_PRODUCT",
] as const;

export type PromoCodeKind = (typeof PROMO_CODE_KINDS)[number];

export type PromoCodeCreateBody = {
  code: string;
  kind: PromoCodeKind;
  percentOff: string;
  amountSom: string;
  freeProductId: string;
  maxTotalRedemptions: string;
  maxPerCustomer: string;
};

export type PromoCodeAdmin = {
  id: string;
  code: string;
  kind: PromoCodeKind;
  percentOff: number | null;
  amountOffCents: number | null;
  freeProductId: string | null;
  freeProductName: string | null;
  maxTotalRedemptions: number | null;
  maxPerCustomer: number;
  redemptionCount: number;
  isActive: boolean;
  createdAt: string;
};

export type PromoQuotePublic = {
  code: string;
  kind: PromoCodeKind;
  discountCents: number;
  payableCents: number;
  giftProductName: string | null;
  message: string;
};

export type PromoPreviewBody = {
  code: string;
};

export type PromoActiveBody = {
  isActive: boolean;
};

export function isPromoCodeKind(value: unknown): value is PromoCodeKind {
  return (
    typeof value === "string" &&
    (PROMO_CODE_KINDS as readonly string[]).includes(value)
  );
}

export function isPromoCodeCreateBody(
  value: unknown,
): value is PromoCodeCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.code === "string" &&
    isPromoCodeKind(body.kind) &&
    typeof body.percentOff === "string" &&
    typeof body.amountSom === "string" &&
    typeof body.freeProductId === "string" &&
    typeof body.maxTotalRedemptions === "string" &&
    typeof body.maxPerCustomer === "string"
  );
}

export function isPromoPreviewBody(value: unknown): value is PromoPreviewBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.code === "string";
}

export function isPromoActiveBody(value: unknown): value is PromoActiveBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.isActive === "boolean";
}

export function normalizePromoCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < 3 || code.length > 32) {
    return null;
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return null;
  }
  return code;
}

export function parseOptionalLimit(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    return undefined;
  }
  return value;
}

export function parseRequiredLimit(raw: string, fallback: number): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    return null;
  }
  return value;
}

export function parsePercentOff(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return null;
  }
  return value;
}

export function computePromoDiscount(input: {
  kind: PromoCodeKind;
  percentOff: number | null;
  amountOffCents: number | null;
  subtotalCents: number;
}): number {
  const subtotal = Math.max(0, input.subtotalCents);
  if (input.kind === "PERCENT") {
    const percent = input.percentOff ?? 0;
    return Math.min(subtotal, Math.floor((subtotal * percent) / 100));
  }
  if (input.kind === "AMOUNT") {
    const amount = input.amountOffCents ?? 0;
    return Math.min(subtotal, Math.max(0, amount));
  }
  return 0;
}

export function promoKindLabel(kind: PromoCodeKind): string {
  switch (kind) {
    case "PERCENT":
      return "Скидка в процентах";
    case "AMOUNT":
      return "Скидка в сомах";
    case "FREE_DELIVERY":
      return "Бесплатная доставка";
    case "FREE_PRODUCT":
      return "Товар в подарок";
  }
}

export function toPromoCodeAdmin(row: {
  id: string;
  code: string;
  kind: PromoCodeKind;
  percentOff: number | null;
  amountOffCents: number | null;
  freeProductId: string | null;
  freeProduct: { name: string } | null;
  maxTotalRedemptions: number | null;
  maxPerCustomer: number;
  redemptionCount: number;
  isActive: boolean;
  createdAt: Date;
}): PromoCodeAdmin {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    percentOff: row.percentOff,
    amountOffCents: row.amountOffCents,
    freeProductId: row.freeProductId,
    freeProductName: row.freeProduct?.name ?? null,
    maxTotalRedemptions: row.maxTotalRedemptions,
    maxPerCustomer: row.maxPerCustomer,
    redemptionCount: row.redemptionCount,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export function describePromoQuote(input: {
  kind: PromoCodeKind;
  discountCents: number;
  giftProductName: string | null;
}): string {
  if (input.kind === "FREE_PRODUCT") {
    const name = input.giftProductName?.trim() || "товар";
    return `Подарок: ${name}`;
  }
  if (input.kind === "FREE_DELIVERY") {
    return "Бесплатная доставка";
  }
  if (input.discountCents <= 0) {
    return "Промокод применён";
  }
  const som = Math.trunc(input.discountCents / 100);
  return `Скидка ${som} сом`;
}
