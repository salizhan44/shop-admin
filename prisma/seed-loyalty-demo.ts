import type { PrismaClient } from "@prisma/client";

const DEMO_PRODUCT_DISCOUNTS: Array<{
  name: string;
  discountPercent?: number;
  discountAmountCents?: number;
}> = [
  { name: "Мука пшеничная в/с 2 кг", discountPercent: 15 },
  { name: "Спагетти 400 г", discountPercent: 10 },
  { name: "Лапша яичная 250 г", discountPercent: 20 },
  { name: "Мука блинная 1 кг", discountAmountCents: 2000 },
  { name: "Доширак классический", discountPercent: 12 },
];

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export async function ensureLoyaltyDemoData(prisma: PrismaClient): Promise<void> {
  for (const item of DEMO_PRODUCT_DISCOUNTS) {
    const product = await prisma.product.findFirst({
      where: { name: item.name, isActive: true },
      select: {
        id: true,
        discountPercent: true,
        discountAmountCents: true,
      },
    });
    if (!product) {
      continue;
    }
    if (product.discountPercent != null || product.discountAmountCents != null) {
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: {
        discountPercent: item.discountPercent ?? null,
        discountAmountCents: item.discountAmountCents ?? null,
      },
    });
  }

  const customers = await prisma.customer.findMany({
    select: { id: true, appSecondsTotal: true, loyaltyPoints: true },
  });
  const random = mulberry32(20260915);
  for (const customer of customers) {
    const data: { appSecondsTotal?: number; loyaltyPoints?: number } = {};
    if (customer.appSecondsTotal <= 0) {
      data.appSecondsTotal = 8 * 60 + Math.floor(random() * 48 * 60);
    }
    if (customer.loyaltyPoints <= 0) {
      data.loyaltyPoints = 80 + Math.floor(random() * 221);
    }
    if (Object.keys(data).length === 0) {
      continue;
    }
    await prisma.customer.update({
      where: { id: customer.id },
      data,
    });
  }
}
