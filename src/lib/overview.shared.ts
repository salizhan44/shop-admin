import type { ConfirmedOrderTotals } from "./analytics.shared";
import {
  formatOrderShortId,
  type OrderStatus,
} from "./orders.shared";

export const OVERVIEW_MONTHS = 12;
export const OVERVIEW_ACTIVITY_LIMIT = 20;

export type MonthlySalesRow = {
  month: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

export type OverviewOrderCounts = {
  pending: number;
  confirmed: number;
  rejected: number;
};

const MONTH_LABELS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

export function toReportMonthKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function toMonthlySalesRow(input: {
  month: string;
  orderCount: number;
  revenueCents: number;
  costCents: number;
}): MonthlySalesRow {
  return {
    month: input.month,
    orderCount: input.orderCount,
    revenueCents: input.revenueCents,
    costCents: input.costCents,
    profitCents: input.revenueCents - input.costCents,
  };
}

export function aggregateMonthlySales(
  orders: ConfirmedOrderTotals[],
): MonthlySalesRow[] {
  const byMonth = new Map<
    string,
    { orderCount: number; revenueCents: number; costCents: number }
  >();

  for (const order of orders) {
    const month = order.createdAt.slice(0, 7);
    const current = byMonth.get(month) ?? {
      orderCount: 0,
      revenueCents: 0,
      costCents: 0,
    };
    current.orderCount += 1;
    current.revenueCents += order.totalCents;
    current.costCents += order.costCents;
    byMonth.set(month, current);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, totals]) =>
      toMonthlySalesRow({
        month,
        orderCount: totals.orderCount,
        revenueCents: totals.revenueCents,
        costCents: totals.costCents,
      }),
    );
}

export function fillMonthlySalesRange(
  rows: MonthlySalesRow[],
  months: number,
  endDate: Date = new Date(),
): MonthlySalesRow[] {
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const filled: MonthlySalesRow[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(end.getFullYear(), end.getMonth() - offset, 1);
    const month = toReportMonthKey(monthDate);
    filled.push(
      byMonth.get(month) ??
        toMonthlySalesRow({
          month,
          orderCount: 0,
          revenueCents: 0,
          costCents: 0,
        }),
    );
  }

  return filled;
}

export function formatReportMonthShort(
  month: string,
  currentYear: number,
): string {
  const [yearText, monthText] = month.split("-");
  const monthIndex = Number(monthText) - 1;
  const label = MONTH_LABELS[monthIndex] ?? month;
  const year = Number(yearText);
  if (!Number.isFinite(year) || year === currentYear) {
    return label;
  }
  return `${label} ${String(year).slice(2)}`;
}

export function monthlySalesMaxCents(rows: MonthlySalesRow[]): number {
  return Math.max(
    1,
    ...rows.flatMap((row) => [row.revenueCents, Math.max(0, row.profitCents)]),
  );
}

export function overviewBarWidthPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) {
    return 0;
  }
  return Math.min(100, (value / max) * 100);
}

export function countOverviewOrderStatuses(
  orders: ReadonlyArray<{ status: OrderStatus }>,
): OverviewOrderCounts {
  let pending = 0;
  let confirmed = 0;
  let rejected = 0;
  for (const order of orders) {
    if (order.status === "PENDING") {
      pending += 1;
    } else if (order.status === "CONFIRMED") {
      confirmed += 1;
    } else {
      rejected += 1;
    }
  }
  return { pending, confirmed, rejected };
}

export function overviewOrderActivityText(
  status: OrderStatus,
  orderId: string,
): string {
  const shortId = formatOrderShortId(orderId);
  switch (status) {
    case "PENDING":
      return `Заказ ${shortId} ожидает`;
    case "CONFIRMED":
      return `Заказ ${shortId} принят`;
    case "REJECTED":
      return `Заказ ${shortId} отклонён`;
  }
}

export function pickOverviewActivity<T>(
  orders: readonly T[],
  limit: number,
): T[] {
  return orders.slice(0, limit);
}
