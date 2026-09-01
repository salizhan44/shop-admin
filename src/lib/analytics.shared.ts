export type SalesSummary = {
  confirmedOrderCount: number;
  confirmedRevenueCents: number;
  pendingOrderCount: number;
  pendingTotalCents: number;
  rejectedOrderCount: number;
};

export type ProductSalesRow = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenueCents: number;
};

export type DailySalesRow = {
  date: string;
  orderCount: number;
  revenueCents: number;
};

export function toSalesSummary(input: {
  confirmedOrderCount: number;
  confirmedRevenueCents: number;
  pendingOrderCount: number;
  pendingTotalCents: number;
  rejectedOrderCount: number;
}): SalesSummary {
  return {
    confirmedOrderCount: input.confirmedOrderCount,
    confirmedRevenueCents: input.confirmedRevenueCents,
    pendingOrderCount: input.pendingOrderCount,
    pendingTotalCents: input.pendingTotalCents,
    rejectedOrderCount: input.rejectedOrderCount,
  };
}

export function toProductSalesRow(input: {
  productId: string;
  productName: string;
  quantitySold: number;
  revenueCents: number;
}): ProductSalesRow {
  return {
    productId: input.productId,
    productName: input.productName,
    quantitySold: input.quantitySold,
    revenueCents: input.revenueCents,
  };
}

export function toDailySalesRow(input: {
  date: string;
  orderCount: number;
  revenueCents: number;
}): DailySalesRow {
  return {
    date: input.date,
    orderCount: input.orderCount,
    revenueCents: input.revenueCents,
  };
}

export function aggregateDailySales(
  orders: Array<{ createdAt: string; totalCents: number }>,
): DailySalesRow[] {
  const byDate = new Map<string, { orderCount: number; revenueCents: number }>();

  for (const order of orders) {
    const date = order.createdAt.slice(0, 10);
    const current = byDate.get(date) ?? { orderCount: 0, revenueCents: 0 };
    current.orderCount += 1;
    current.revenueCents += order.totalCents;
    byDate.set(date, current);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, totals]) =>
      toDailySalesRow({
        date,
        orderCount: totals.orderCount,
        revenueCents: totals.revenueCents,
      }),
    );
}

export function formatReportDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}
