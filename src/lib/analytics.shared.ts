export type SalesSummary = {
  confirmedOrderCount: number;
  confirmedRevenueCents: number;
  confirmedCostCents: number;
  confirmedProfitCents: number;
  pendingOrderCount: number;
  pendingTotalCents: number;
  rejectedOrderCount: number;
};

export type ProductSalesRow = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

export type DailySalesRow = {
  date: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

export type ConfirmedOrderTotals = {
  createdAt: string;
  totalCents: number;
  costCents: number;
};

export type OrderItemSalesInput = {
  productId: string;
  productName: string;
  quantity: number;
  lineTotalCents: number;
  unitCostCents: number;
};

export function toSalesSummary(input: {
  confirmedOrderCount: number;
  confirmedRevenueCents: number;
  confirmedCostCents: number;
  pendingOrderCount: number;
  pendingTotalCents: number;
  rejectedOrderCount: number;
}): SalesSummary {
  return {
    confirmedOrderCount: input.confirmedOrderCount,
    confirmedRevenueCents: input.confirmedRevenueCents,
    confirmedCostCents: input.confirmedCostCents,
    confirmedProfitCents: input.confirmedRevenueCents - input.confirmedCostCents,
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
  costCents: number;
}): ProductSalesRow {
  return {
    productId: input.productId,
    productName: input.productName,
    quantitySold: input.quantitySold,
    revenueCents: input.revenueCents,
    costCents: input.costCents,
    profitCents: input.revenueCents - input.costCents,
  };
}

export function toDailySalesRow(input: {
  date: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
}): DailySalesRow {
  return {
    date: input.date,
    orderCount: input.orderCount,
    revenueCents: input.revenueCents,
    costCents: input.costCents,
    profitCents: input.revenueCents - input.costCents,
  };
}

export function toReportDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sumLineCostCents(items: Array<{
  quantity: number;
  unitCostCents: number;
}>): number {
  return items.reduce(
    (sum, item) => sum + item.unitCostCents * item.quantity,
    0,
  );
}

export function aggregateDailySales(
  orders: ConfirmedOrderTotals[],
): DailySalesRow[] {
  const byDate = new Map<
    string,
    { orderCount: number; revenueCents: number; costCents: number }
  >();

  for (const order of orders) {
    const date = order.createdAt.slice(0, 10);
    const current = byDate.get(date) ?? {
      orderCount: 0,
      revenueCents: 0,
      costCents: 0,
    };
    current.orderCount += 1;
    current.revenueCents += order.totalCents;
    current.costCents += order.costCents;
    byDate.set(date, current);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, totals]) =>
      toDailySalesRow({
        date,
        orderCount: totals.orderCount,
        revenueCents: totals.revenueCents,
        costCents: totals.costCents,
      }),
    );
}

export function fillDailySalesRange(
  rows: DailySalesRow[],
  days: number,
  endDate: Date = new Date(),
): DailySalesRow[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const filled: DailySalesRow[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setDate(end.getDate() - offset);
    const date = toReportDateKey(day);
    filled.push(
      byDate.get(date) ??
        toDailySalesRow({
          date,
          orderCount: 0,
          revenueCents: 0,
          costCents: 0,
        }),
    );
  }

  return filled;
}

export function aggregateProductSales(
  items: OrderItemSalesInput[],
): ProductSalesRow[] {
  const byProduct = new Map<
    string,
    {
      productName: string;
      quantitySold: number;
      revenueCents: number;
      costCents: number;
    }
  >();

  for (const item of items) {
    const current = byProduct.get(item.productId) ?? {
      productName: item.productName,
      quantitySold: 0,
      revenueCents: 0,
      costCents: 0,
    };
    current.productName = item.productName;
    current.quantitySold += item.quantity;
    current.revenueCents += item.lineTotalCents;
    current.costCents += item.unitCostCents * item.quantity;
    byProduct.set(item.productId, current);
  }

  return [...byProduct.entries()]
    .map(([productId, totals]) =>
      toProductSalesRow({
        productId,
        productName: totals.productName,
        quantitySold: totals.quantitySold,
        revenueCents: totals.revenueCents,
        costCents: totals.costCents,
      }),
    )
    .sort((left, right) => right.profitCents - left.profitCents);
}

export function pickProfitLeaders(
  rows: ProductSalesRow[],
  limit: number,
): { top: ProductSalesRow[]; bottom: ProductSalesRow[] } {
  const top = rows.slice(0, limit);
  const bottom = [...rows].slice(-limit).reverse();
  return { top, bottom };
}

export function formatReportDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

export function formatReportDayShort(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(day)}.${month}`;
}

export const CHART_ZOOM_MIN = 1;
export const CHART_ZOOM_MAX = 8;

export function clampChartZoom(zoom: number): number {
  return Math.min(CHART_ZOOM_MAX, Math.max(CHART_ZOOM_MIN, zoom));
}

/** Колесо вниз — отдалить, вверх — приблизить. */
export function nextChartZoom(zoom: number, deltaY: number): number {
  if (deltaY === 0) {
    return clampChartZoom(zoom);
  }
  const factor = deltaY > 0 ? 1 / 1.14 : 1.14;
  return clampChartZoom(zoom * factor);
}

export function chartScrollAfterZoom(input: {
  contentX: number;
  cursorOffsetX: number;
  oldZoom: number;
  newZoom: number;
  padLeft?: number;
}): number {
  if (input.oldZoom <= 0) {
    return 0;
  }
  const padLeft = input.padLeft ?? 0;
  const dataX = input.contentX - padLeft;
  const nextContentX = padLeft + dataX * (input.newZoom / input.oldZoom);
  return Math.max(0, nextContentX - input.cursorOffsetX);
}

export type CategorySalesInput = {
  categoryId: string | null;
  categoryName: string | null;
  revenueCents: number;
};

export type CategorySalesShare = {
  categoryId: string;
  categoryName: string;
  revenueCents: number;
  percent: number;
};

export const CATEGORY_SALES_CHART_COLORS = [
  "#061e3a",
  "#3378b3",
  "#d7b168",
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#3f6212",
] as const;

export function categoryChartColor(index: number): string {
  return CATEGORY_SALES_CHART_COLORS[index % CATEGORY_SALES_CHART_COLORS.length];
}

export function formatCategorySalesPercent(percent: number): string {
  const value = Math.round(percent * 10) / 10;
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
}

export function categorySalesPercents(revenues: number[]): number[] {
  const total = revenues.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return revenues.map(() => 0);
  }
  const rounded = revenues.map(
    (value) => Math.round((value / total) * 1000) / 10,
  );
  const drift =
    Math.round((100 - rounded.reduce((sum, value) => sum + value, 0)) * 10) / 10;
  if (rounded.length > 0 && drift !== 0) {
    let maxIndex = 0;
    for (let index = 1; index < rounded.length; index += 1) {
      if ((rounded[index] ?? 0) > (rounded[maxIndex] ?? 0)) {
        maxIndex = index;
      }
    }
    rounded[maxIndex] = Math.round(((rounded[maxIndex] ?? 0) + drift) * 10) / 10;
  }
  return rounded;
}

export function aggregateCategorySales(
  items: CategorySalesInput[],
  uncategorizedLabel: string,
  uncategorizedId: string,
): CategorySalesShare[] {
  const byKey = new Map<string, { categoryName: string; revenueCents: number }>();
  for (const item of items) {
    if (item.revenueCents <= 0) {
      continue;
    }
    const categoryId = item.categoryId ?? uncategorizedId;
    const categoryName = item.categoryName?.trim() || uncategorizedLabel;
    const current = byKey.get(categoryId) ?? {
      categoryName,
      revenueCents: 0,
    };
    current.categoryName = categoryName;
    current.revenueCents += item.revenueCents;
    byKey.set(categoryId, current);
  }
  const rows = [...byKey.entries()]
    .map(([categoryId, totals]) => ({
      categoryId,
      categoryName: totals.categoryName,
      revenueCents: totals.revenueCents,
    }))
    .sort(
      (left, right) =>
        right.revenueCents - left.revenueCents ||
        left.categoryName.localeCompare(right.categoryName, "ru"),
    );
  const percents = categorySalesPercents(rows.map((row) => row.revenueCents));
  return rows.map((row, index) => ({
    ...row,
    percent: percents[index] ?? 0,
  }));
}
