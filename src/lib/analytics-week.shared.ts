import { toReportDateKey } from "./analytics.shared";

export type WeekTotals = {
  revenueCents: number;
  profitCents: number;
};

export type WeekChange = {
  current: WeekTotals;
  previous: WeekTotals;
  revenueChangePercent: number | null;
  profitChangePercent: number | null;
};

export type CategoryWeekCard = WeekChange & {
  categoryId: string;
  categoryName: string;
};

export type AnalyticsWeekSnapshot = {
  overall: WeekChange;
  categories: CategoryWeekCard[];
  uncategorized: CategoryWeekCard;
};

export type AnalyticsTrendDirection = "up" | "down" | "flat";

export type WeekWindowDateKeys = {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
};

export type CategoryWeekItem = {
  categoryId: string | null;
  categoryName: string | null;
  date: string;
  revenueCents: number;
  costCents: number;
};

export const ANALYTICS_WEEK_CATEGORY_LIMIT = 3;
export const ANALYTICS_TREND_UP_COLOR = "#3378b3";
export const ANALYTICS_TREND_DOWN_COLOR = "#dc2626";

export function emptyWeekTotals(): WeekTotals {
  return { revenueCents: 0, profitCents: 0 };
}

export function addWeekTotals(left: WeekTotals, right: WeekTotals): WeekTotals {
  return {
    revenueCents: left.revenueCents + right.revenueCents,
    profitCents: left.profitCents + right.profitCents,
  };
}

export function weekChangePercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function toWeekChange(
  current: WeekTotals,
  previous: WeekTotals,
): WeekChange {
  return {
    current,
    previous,
    revenueChangePercent: weekChangePercent(
      current.revenueCents,
      previous.revenueCents,
    ),
    profitChangePercent: weekChangePercent(
      current.profitCents,
      previous.profitCents,
    ),
  };
}

export function analyticsTrendDirection(
  changePercent: number | null,
  currentValue: number,
): AnalyticsTrendDirection {
  if (changePercent === null) {
    return currentValue > 0 ? "up" : "flat";
  }
  if (changePercent > 0) {
    return "up";
  }
  if (changePercent < 0) {
    return "down";
  }
  return "flat";
}

export function formatWeekChangePercent(changePercent: number | null): string {
  if (changePercent === null) {
    return "—";
  }
  const value = Math.round(changePercent * 10) / 10;
  const text = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  if (value > 0) {
    return `+${text}%`;
  }
  return `${text}%`;
}

export function weekWindowDateKeys(endDate: Date = new Date()): WeekWindowDateKeys {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const currentStart = new Date(end);
  currentStart.setDate(end.getDate() - 6);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - 6);
  return {
    currentStart: toReportDateKey(currentStart),
    currentEnd: toReportDateKey(end),
    previousStart: toReportDateKey(previousStart),
    previousEnd: toReportDateKey(previousEnd),
  };
}

export function isDateKeyInInclusiveRange(
  date: string,
  start: string,
  end: string,
): boolean {
  return date >= start && date <= end;
}

function toItemTotals(item: CategoryWeekItem): WeekTotals {
  return {
    revenueCents: item.revenueCents,
    profitCents: item.revenueCents - item.costCents,
  };
}

export function buildAnalyticsWeekSnapshot(
  items: CategoryWeekItem[],
  namedCategories: Array<{ id: string; name: string }>,
  uncategorizedLabel: string,
  uncategorizedId: string,
  window: WeekWindowDateKeys,
  categoryLimit: number,
): AnalyticsWeekSnapshot {
  const named = new Map<string, { name: string; current: WeekTotals; previous: WeekTotals }>();
  for (const category of namedCategories) {
    named.set(category.id, {
      name: category.name,
      current: emptyWeekTotals(),
      previous: emptyWeekTotals(),
    });
  }
  let overallCurrent = emptyWeekTotals();
  let overallPrevious = emptyWeekTotals();
  let uncategorizedCurrent = emptyWeekTotals();
  let uncategorizedPrevious = emptyWeekTotals();

  for (const item of items) {
    const inCurrent = isDateKeyInInclusiveRange(
      item.date,
      window.currentStart,
      window.currentEnd,
    );
    const inPrevious = isDateKeyInInclusiveRange(
      item.date,
      window.previousStart,
      window.previousEnd,
    );
    if (!inCurrent && !inPrevious) {
      continue;
    }
    const totals = toItemTotals(item);
    if (inCurrent) {
      overallCurrent = addWeekTotals(overallCurrent, totals);
    } else {
      overallPrevious = addWeekTotals(overallPrevious, totals);
    }
    const categoryId = item.categoryId;
    if (!categoryId) {
      if (inCurrent) {
        uncategorizedCurrent = addWeekTotals(uncategorizedCurrent, totals);
      } else {
        uncategorizedPrevious = addWeekTotals(uncategorizedPrevious, totals);
      }
      continue;
    }
    const current = named.get(categoryId) ?? {
      name: item.categoryName?.trim() || uncategorizedLabel,
      current: emptyWeekTotals(),
      previous: emptyWeekTotals(),
    };
    if (inCurrent) {
      current.current = addWeekTotals(current.current, totals);
    } else {
      current.previous = addWeekTotals(current.previous, totals);
    }
    named.set(categoryId, current);
  }

  const categories = [...named.entries()]
    .map(([categoryId, row]) => ({
      categoryId,
      categoryName: row.name,
      ...toWeekChange(row.current, row.previous),
    }))
    .sort(
      (left, right) =>
        right.current.revenueCents - left.current.revenueCents ||
        right.previous.revenueCents - left.previous.revenueCents ||
        left.categoryName.localeCompare(right.categoryName, "ru"),
    )
    .slice(0, categoryLimit);

  while (categories.length < categoryLimit) {
    categories.push({
      categoryId: `__empty_${categories.length}`,
      categoryName: "—",
      ...toWeekChange(emptyWeekTotals(), emptyWeekTotals()),
    });
  }

  return {
    overall: toWeekChange(overallCurrent, overallPrevious),
    categories,
    uncategorized: {
      categoryId: uncategorizedId,
      categoryName: uncategorizedLabel,
      ...toWeekChange(uncategorizedCurrent, uncategorizedPrevious),
    },
  };
}
