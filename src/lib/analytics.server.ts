import { prisma } from "./prisma.server";
import {
  UNCATEGORIZED_CATALOG_FILTER_ID,
  UNCATEGORIZED_WAREHOUSE_LABEL,
} from "./products.shared";
import {
  ANALYTICS_WEEK_CATEGORY_LIMIT,
  buildAnalyticsWeekSnapshot,
  weekWindowDateKeys,
  type AnalyticsWeekSnapshot,
} from "./analytics-week.shared";
import {
  aggregateMonthlySales,
  fillMonthlySalesRange,
  type MonthlySalesRow,
} from "./overview.shared";
import {
  aggregateCategorySales,
  aggregateDailySales,
  aggregateProductSales,
  fillDailySalesRange,
  sumLineCostCents,
  toReportDateKey,
  toSalesSummary,
  type CategorySalesShare,
  type DailySalesRow,
  type ProductSalesRow,
  type SalesSummary,
} from "./analytics.shared";
import { averageAppSeconds } from "./session-time.shared";

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

export async function getMonthlySales(months: number): Promise<MonthlySalesRow[]> {
  const end = new Date();
  const since = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);

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

  const aggregated = aggregateMonthlySales(
    orders.map((order) => ({
      createdAt: toReportDateKey(order.createdAt),
      totalCents: order.totalCents,
      costCents: sumLineCostCents(order.items),
    })),
  );

  return fillMonthlySalesRange(aggregated, months, end);
}

export async function getCategorySalesShares(): Promise<CategorySalesShare[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: "CONFIRMED" } },
    select: {
      lineTotalCents: true,
      product: {
        select: {
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return aggregateCategorySales(
    items.map((item) => ({
      categoryId: item.product.categoryId,
      categoryName: item.product.category?.name ?? null,
      revenueCents: item.lineTotalCents,
    })),
    UNCATEGORIZED_WAREHOUSE_LABEL,
    UNCATEGORIZED_CATALOG_FILTER_ID,
  );
}

export async function getAnalyticsWeekSnapshot(): Promise<AnalyticsWeekSnapshot> {
  const window = weekWindowDateKeys();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  const [items, categories] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        order: { status: "CONFIRMED", createdAt: { gte: since } },
      },
      select: {
        lineTotalCents: true,
        quantity: true,
        unitCostCents: true,
        order: { select: { createdAt: true } },
        product: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return buildAnalyticsWeekSnapshot(
    items.map((item) => ({
      categoryId: item.product.categoryId,
      categoryName: item.product.category?.name ?? null,
      date: toReportDateKey(item.order.createdAt),
      revenueCents: item.lineTotalCents,
      costCents: item.unitCostCents * item.quantity,
    })),
    categories,
    UNCATEGORIZED_WAREHOUSE_LABEL,
    UNCATEGORIZED_CATALOG_FILTER_ID,
    window,
    ANALYTICS_WEEK_CATEGORY_LIMIT,
  );
}

export async function getAverageAppSeconds(): Promise<number> {
  const rows = await prisma.customer.findMany({
    where: { appSecondsTotal: { gt: 0 } },
    select: { appSecondsTotal: true },
  });
  return averageAppSeconds(rows.map((row) => row.appSecondsTotal));
}
