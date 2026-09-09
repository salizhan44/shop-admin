import { prisma } from "./prisma.server";
import {
  aggregateDailySales,
  aggregateProductSales,
  fillDailySalesRange,
  sumLineCostCents,
  toReportDateKey,
  toSalesSummary,
  type DailySalesRow,
  type ProductSalesRow,
  type SalesSummary,
} from "./analytics.shared";

export async function getSalesSummary(): Promise<SalesSummary> {
  const [confirmed, pending, rejected, confirmedItems] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: "PENDING" },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: "REJECTED" },
      _count: true,
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "CONFIRMED" } },
      select: { quantity: true, unitCostCents: true },
    }),
  ]);

  return toSalesSummary({
    confirmedOrderCount: confirmed._count,
    confirmedRevenueCents: confirmed._sum.totalCents ?? 0,
    confirmedCostCents: sumLineCostCents(confirmedItems),
    pendingOrderCount: pending._count,
    pendingTotalCents: pending._sum.totalCents ?? 0,
    rejectedOrderCount: rejected._count,
  });
}

export async function getProductProfitRanks(): Promise<ProductSalesRow[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: "CONFIRMED" } },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      lineTotalCents: true,
      unitCostCents: true,
    },
  });

  return aggregateProductSales(items);
}

export async function getTopProducts(limit: number): Promise<ProductSalesRow[]> {
  return (await getProductProfitRanks()).slice(0, limit);
}

export async function getDailySales(days: number): Promise<DailySalesRow[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: {
      status: "CONFIRMED",
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      totalCents: true,
      items: { select: { quantity: true, unitCostCents: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const aggregated = aggregateDailySales(
    orders.map((order) => ({
      createdAt: toReportDateKey(order.createdAt),
      totalCents: order.totalCents,
      costCents: sumLineCostCents(order.items),
    })),
  );

  return fillDailySalesRange(aggregated, days);
}
