import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { groceryCostCents } from "./seed-grocery";

export const DEMO_ORDER_COMMENT = "[demo-analytics]";

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends { weight: number }>(
  items: T[],
  random: () => number,
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item;
    }
  }
  return items[items.length - 1]!;
}

function productWeight(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("доширак") || lower.includes("роллтон")) {
    return 9;
  }
  if (lower.includes("спагетти") || lower.includes("перья") || lower.includes("мука пшеничная в/с 2")) {
    return 7;
  }
  if (lower.includes("мука") || lower.includes("макарон") || lower.includes("вермишель")) {
    return 5;
  }
  if (lower.startsWith("товар")) {
    return 1.2;
  }
  return 3;
}

export async function ensureDemoOrders(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.order.count({
    where: { comment: DEMO_ORDER_COMMENT },
  });
  if (existing > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("testpass8", 10);
  const customerIds: string[] = [];
  for (let index = 1; index <= 8; index += 1) {
    const email = `demo.buyer${index}@local.test`;
    const row = await prisma.customer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        name: `Демо клиент ${index}`,
        homeAddress: `Бишкек, ул. Демо ${index}`,
      },
      select: { id: true },
    });
    customerIds.push(row.id);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      priceCents: true,
      costCents: true,
      stockQuantity: true,
    },
  });
  if (products.length === 0) {
    return;
  }

  const remaining = new Map(
    products.map((product) => [product.id, product.stockQuantity]),
  );
  const weighted = products.map((product) => ({
    ...product,
    costCents:
      product.costCents > 0
        ? product.costCents
        : groceryCostCents(product.priceCents, product.name),
    weight: productWeight(product.name),
  }));

  const random = mulberry32(20260909);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dayCount = 45;

  type DraftItem = {
    productId: string;
    productName: string;
    priceCents: number;
    unitCostCents: number;
    quantity: number;
    lineTotalCents: number;
  };

  for (let dayOffset = dayCount - 1; dayOffset >= 0; dayOffset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - dayOffset);
    const weekday = day.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const quiet = random() < 0.08;
    let orderCount = quiet ? 0 : 1 + Math.floor(random() * 3);
    if (isWeekend) {
      orderCount += 1 + Math.floor(random() * 2);
    }
    if (dayOffset === 0) {
      orderCount = Math.max(orderCount, 2);
    }

    for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
      const itemCount = 1 + Math.floor(random() * 3);
      const used = new Set<string>();
      const items: DraftItem[] = [];
      for (let slot = 0; slot < itemCount; slot += 1) {
        const product = pickWeighted(weighted, random);
        if (used.has(product.id)) {
          continue;
        }
        used.add(product.id);
        const quantity = 1 + Math.floor(random() * (product.weight >= 7 ? 3 : 2));
        const left = remaining.get(product.id) ?? 0;
        if (left < quantity) {
          continue;
        }
        items.push({
          productId: product.id,
          productName: product.name,
          priceCents: product.priceCents,
          unitCostCents: product.costCents,
          quantity,
          lineTotalCents: product.priceCents * quantity,
        });
      }
      if (items.length === 0) {
        continue;
      }

      const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
      let status: "CONFIRMED" | "PENDING" | "REJECTED" = "CONFIRMED";
      if (dayOffset <= 1 && random() < 0.28) {
        status = "PENDING";
      } else if (random() < 0.07) {
        status = "REJECTED";
      }

      const hour = 9 + Math.floor(random() * 11);
      const minute = Math.floor(random() * 60);
      const createdAt = new Date(day);
      createdAt.setHours(hour, minute, Math.floor(random() * 50), 0);

      const customerId = customerIds[Math.floor(random() * customerIds.length)]!;
      await prisma.order.create({
        data: {
          customerId,
          status,
          totalCents,
          phone: "+996555000011",
          address: "Бишкек, тестовый адрес",
          comment: DEMO_ORDER_COMMENT,
          rejectionReason:
            status === "REJECTED" ? "Демо: нет в нужном количестве" : null,
          createdAt,
          items: { create: items },
        },
      });

      if (status === "CONFIRMED") {
        for (const item of items) {
          remaining.set(
            item.productId,
            (remaining.get(item.productId) ?? 0) - item.quantity,
          );
        }
      }
    }
  }

  for (const [productId, stockQuantity] of remaining) {
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: Math.max(0, stockQuantity) },
    });
  }
}

export const DEMO_YEAR_ORDER_COMMENT = "[demo-year]";

export async function ensureDemoYearOrders(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.order.count({
    where: { comment: DEMO_YEAR_ORDER_COMMENT },
  });
  if (existing > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("testpass8", 10);
  const customerIds: string[] = [];
  for (let index = 1; index <= 8; index += 1) {
    const email = `demo.buyer${index}@local.test`;
    const row = await prisma.customer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        name: `Демо клиент ${index}`,
        homeAddress: `Бишкек, ул. Демо ${index}`,
      },
      select: { id: true },
    });
    customerIds.push(row.id);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      priceCents: true,
      costCents: true,
    },
  });
  if (products.length === 0) {
    return;
  }

  const weighted = products.map((product) => ({
    ...product,
    costCents:
      product.costCents > 0
        ? product.costCents
        : groceryCostCents(product.priceCents, product.name),
    weight: productWeight(product.name),
  }));

  const random = mulberry32(20260912);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  type DraftItem = {
    productId: string;
    productName: string;
    priceCents: number;
    unitCostCents: number;
    quantity: number;
    lineTotalCents: number;
  };

  for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();
    const season = monthStart.getMonth();
    const winterBoost = season === 10 || season === 11 || season === 0 ? 6 : 0;
    const summerDip = season >= 5 && season <= 7 ? -3 : 0;
    const recentBoost = monthOffset <= 2 ? 8 : 0;
    const orderCount = Math.max(
      6,
      10 + winterBoost + summerDip + recentBoost + Math.floor(random() * 5),
    );

    for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
      const itemCount = 1 + Math.floor(random() * 3);
      const used = new Set<string>();
      const items: DraftItem[] = [];
      for (let slot = 0; slot < itemCount; slot += 1) {
        const product = pickWeighted(weighted, random);
        if (used.has(product.id)) {
          continue;
        }
        used.add(product.id);
        const quantity = 1 + Math.floor(random() * (product.weight >= 7 ? 4 : 2));
        items.push({
          productId: product.id,
          productName: product.name,
          priceCents: product.priceCents,
          unitCostCents: product.costCents,
          quantity,
          lineTotalCents: product.priceCents * quantity,
        });
      }
      if (items.length === 0) {
        continue;
      }

      const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
      let status: "CONFIRMED" | "PENDING" | "REJECTED" = "CONFIRMED";
      if (monthOffset === 0 && random() < 0.12) {
        status = "PENDING";
      } else if (random() < 0.06) {
        status = "REJECTED";
      }

      const day = 1 + Math.floor(random() * daysInMonth);
      const createdAt = new Date(monthStart);
      createdAt.setDate(day);
      createdAt.setHours(9 + Math.floor(random() * 11), Math.floor(random() * 60), 0, 0);
      if (createdAt > today) {
        createdAt.setTime(today.getTime() - Math.floor(random() * 36) * 3600000);
      }

      const customerId = customerIds[Math.floor(random() * customerIds.length)]!;
      await prisma.order.create({
        data: {
          customerId,
          status,
          totalCents,
          phone: "+996555000011",
          address: "Бишкек, тестовый адрес",
          comment: DEMO_YEAR_ORDER_COMMENT,
          rejectionReason:
            status === "REJECTED" ? "Демо: нет в нужном количестве" : null,
          createdAt,
          items: { create: items },
        },
      });
    }
  }
}
