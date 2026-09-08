import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";
import { parsePriceToCents } from "./products.shared";
import {
  computePromoDiscount,
  describePromoQuote,
  isPromoCodeKind,
  normalizePromoCode,
  parseOptionalLimit,
  parsePercentOff,
  parseRequiredLimit,
  toPromoCodeAdmin,
  type PromoCodeAdmin,
  type PromoCodeCreateBody,
  type PromoQuotePublic,
} from "./promo.shared";

type Tx = Prisma.TransactionClient;

export type CartLineForPromo = {
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type PromoPlan = {
  promoId: string;
  code: string;
  kind: PromoQuotePublic["kind"];
  discountCents: number;
  giftLine: CartLineForPromo | null;
  quote: PromoQuotePublic;
};

export async function listPromoCodesForStaff(): Promise<PromoCodeAdmin[]> {
  const rows = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { freeProduct: { select: { name: true } } },
  });
  return rows.map(toPromoCodeAdmin);
}

export async function createPromoCode(
  body: PromoCodeCreateBody,
): Promise<PromoCodeAdmin | { error: string; status: number }> {
  const code = normalizePromoCode(body.code);
  if (!code || !isPromoCodeKind(body.kind)) {
    return {
      error: "Код: 3–32 символа, латиница, цифры, _ или -",
      status: 400,
    };
  }

  let percentOff: number | null = null;
  let amountOffCents: number | null = null;
  let freeProductId: string | null = null;

  if (body.kind === "PERCENT") {
    percentOff = parsePercentOff(body.percentOff);
    if (percentOff === null) {
      return { error: "Укажите процент от 1 до 100", status: 400 };
    }
  } else if (body.kind === "AMOUNT") {
    amountOffCents = parsePriceToCents(body.amountSom);
    if (amountOffCents === null) {
      return { error: "Укажите сумму скидки в сомах", status: 400 };
    }
  } else if (body.kind === "FREE_PRODUCT") {
    const productId = body.freeProductId.trim();
    if (!productId) {
      return { error: "Выберите товар в подарок", status: 400 };
    }
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      return { error: "Товар для подарка не найден", status: 400 };
    }
    freeProductId = product.id;
  }

  const maxTotalRedemptions = parseOptionalLimit(body.maxTotalRedemptions);
  if (maxTotalRedemptions === undefined) {
    return {
      error: "Общий лимит — целое число от 1 или пусто (без лимита)",
      status: 400,
    };
  }
  const maxPerCustomer = parseRequiredLimit(body.maxPerCustomer, 1);
  if (maxPerCustomer === null) {
    return { error: "Лимит на человека — целое число от 1", status: 400 };
  }

  try {
    const created = await prisma.promoCode.create({
      data: {
        code,
        kind: body.kind,
        percentOff,
        amountOffCents,
        freeProductId,
        maxTotalRedemptions,
        maxPerCustomer,
      },
      include: { freeProduct: { select: { name: true } } },
    });
    return toPromoCodeAdmin(created);
  } catch {
    return { error: "Такой промокод уже есть", status: 409 };
  }
}

export async function setPromoCodeActive(
  promoId: string,
  isActive: boolean,
): Promise<PromoCodeAdmin | { error: string; status: number }> {
  const existing = await prisma.promoCode.findUnique({
    where: { id: promoId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Промокод не найден", status: 404 };
  }
  const updated = await prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive },
    include: { freeProduct: { select: { name: true } } },
  });
  return toPromoCodeAdmin(updated);
}

async function loadUsablePromo(code: string) {
  return prisma.promoCode.findUnique({
    where: { code },
    include: {
      freeProduct: {
        select: { id: true, name: true, priceCents: true, isActive: true },
      },
    },
  });
}

function buildPlan(
  promo: NonNullable<Awaited<ReturnType<typeof loadUsablePromo>>>,
  subtotalCents: number,
): PromoPlan | { error: string; status: number } {
  if (!promo.isActive) {
    return { error: "Промокод не действует", status: 400 };
  }
  let giftLine: CartLineForPromo | null = null;
  if (promo.kind === "FREE_PRODUCT") {
    const product = promo.freeProduct;
    if (!product || !product.isActive) {
      return { error: "Подарочный товар недоступен", status: 400 };
    }
    giftLine = {
      productId: product.id,
      productName: product.name,
      priceCents: 0,
      quantity: 1,
      lineTotalCents: 0,
    };
  }
  const discountCents = computePromoDiscount({
    kind: promo.kind,
    percentOff: promo.percentOff,
    amountOffCents: promo.amountOffCents,
    subtotalCents,
  });
  const quote: PromoQuotePublic = {
    code: promo.code,
    kind: promo.kind,
    discountCents,
    payableCents: Math.max(0, subtotalCents - discountCents),
    giftProductName: giftLine?.productName ?? null,
    message: describePromoQuote({
      kind: promo.kind,
      discountCents,
      giftProductName: giftLine?.productName ?? null,
    }),
  };
  return {
    promoId: promo.id,
    code: promo.code,
    kind: promo.kind,
    discountCents,
    giftLine,
    quote,
  };
}

export async function previewPromoForCustomer(input: {
  customerId: string;
  code: string;
  subtotalCents: number;
}): Promise<PromoQuotePublic | { error: string; status: number }> {
  const code = normalizePromoCode(input.code);
  if (!code) {
    return { error: "Введите корректный промокод", status: 400 };
  }
  const promo = await loadUsablePromo(code);
  if (!promo) {
    return { error: "Промокод не найден", status: 400 };
  }
  const usedByCustomer = await prisma.promoRedemption.count({
    where: { promoCodeId: promo.id, customerId: input.customerId },
  });
  if (usedByCustomer >= promo.maxPerCustomer) {
    return { error: "Вы уже использовали этот промокод", status: 400 };
  }
  if (
    promo.maxTotalRedemptions !== null &&
    promo.redemptionCount >= promo.maxTotalRedemptions
  ) {
    return { error: "Промокод больше не действует", status: 400 };
  }
  const plan = buildPlan(promo, input.subtotalCents);
  if ("error" in plan) {
    return plan;
  }
  return plan.quote;
}

export async function consumePromoInTransaction(
  tx: Tx,
  input: {
    customerId: string;
    code: string;
    subtotalCents: number;
  },
): Promise<PromoPlan | { error: string; status: number }> {
  const code = normalizePromoCode(input.code);
  if (!code) {
    return { error: "Введите корректный промокод", status: 400 };
  }
  const promo = await tx.promoCode.findUnique({
    where: { code },
    include: {
      freeProduct: {
        select: { id: true, name: true, priceCents: true, isActive: true },
      },
    },
  });
  if (!promo || !promo.isActive) {
    return { error: "Промокод не найден", status: 400 };
  }
  const usedByCustomer = await tx.promoRedemption.count({
    where: { promoCodeId: promo.id, customerId: input.customerId },
  });
  if (usedByCustomer >= promo.maxPerCustomer) {
    return { error: "Вы уже использовали этот промокод", status: 400 };
  }
  const bumped = await tx.promoCode.updateMany({
    where: {
      id: promo.id,
      isActive: true,
      ...(promo.maxTotalRedemptions === null
        ? {}
        : { redemptionCount: { lt: promo.maxTotalRedemptions } }),
    },
    data: { redemptionCount: { increment: 1 } },
  });
  if (bumped.count !== 1) {
    return { error: "Промокод больше не действует", status: 400 };
  }
  const plan = buildPlan(promo, input.subtotalCents);
  if ("error" in plan) {
    return plan;
  }
  return plan;
}

export function isPromoError(
  value: PromoPlan | PromoQuotePublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
