import { prisma } from "./prisma.server";
import {
  aggregateDailySales,
  toProductSalesRow,
  toSalesSummary,
  type DailySalesRow,
  type ProductSalesRow,
  type SalesSummary,
} from "./analytics.shared";

export async function getSalesSummary(): Promise<SalesSummary> {
  const [confirmed, pending, rejected] = await Promise.all([
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
  ]);

  return toSalesSummary({
    confirmedOrderCount: confirmed._count,
    confirmedRevenueCents: confirmed._sum.totalCents ?? 0,
    pendingOrderCount: pending._count,
    pendingTotalCents: pending._sum.totalCents ?? 0,
    rejectedOrderCount: rejected._count,
  });
}

export async function getTopProducts(limit: number): Promise<ProductSalesRow[]> {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: { order: { status: "CONFIRMED" } },
    _sum: { quantity: true, lineTotalCents: true },
    orderBy: { _sum: { lineTotalCents: "desc" } },
    take: limit,
  });

  return rows.map((row) =>
    toProductSalesRow({
      productId: row.productId,
      productName: row.productName,
      quantitySold: row._sum.quantity ?? 0,
      revenueCents: row._sum.lineTotalCents ?? 0,
    }),
  );
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
    select: { createdAt: true, totalCents: true },
    orderBy: { createdAt: "asc" },
  });

  return aggregateDailySales(
    orders.map((order) => ({
      createdAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
    })),
  );
}
