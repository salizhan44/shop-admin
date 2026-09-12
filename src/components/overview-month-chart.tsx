"use client";

import { useState } from "react";
import {
  formatReportMonthShort,
  monthlySalesMaxCents,
  overviewBarWidthPercent,
  type MonthlySalesRow,
} from "@/lib/overview.shared";
import { formatPriceSomLabel, formatSignedSomLabel } from "@/lib/products.shared";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";

const PLOT_HEIGHT_CLASS = "h-48";

export function OverviewMonthChart(props: { months: MonthlySalesRow[] }) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const maxCents = monthlySalesMaxCents(props.months);
  const currentYear = new Date().getFullYear();
  const active = props.months.find((row) => row.month === activeMonth) ?? null;

  return (
    <section className={`${UI_CARD_CLASS} px-4 py-4 sm:px-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          За 12 месяцев
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-blue-500" />
            Выручка
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-teal-600" />
            Прибыль
          </span>
        </div>
      </div>
      {active ? (
        <p className="mb-3 text-sm text-zinc-800">
          <span className="font-medium">
            {formatReportMonthShort(active.month, currentYear)}
          </span>
          {" · "}
          {formatPriceSomLabel(active.revenueCents)} выручка
          {" · "}
          {formatSignedSomLabel(active.profitCents)} прибыль
        </p>
      ) : (
        <p className={`mb-3 ${UI_MUTED_CLASS}`}>Наведите на месяц</p>
      )}
      {props.months.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет данных</p>
      ) : (
        <div className="min-w-0">
          <div className={`relative flex ${PLOT_HEIGHT_CLASS} gap-3`}>
            <div className="relative w-16 shrink-0 text-right text-[10px] leading-none text-zinc-400">
              <span className="absolute right-0 top-0 -translate-y-1/2">
                {formatPriceSomLabel(maxCents)}
              </span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2">
                {formatPriceSomLabel(Math.round(maxCents / 2))}
              </span>
              <span className="absolute right-0 bottom-0 translate-y-1/2">
                0
              </span>
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute inset-0">
                <span className="absolute inset-x-0 top-0 h-px bg-zinc-300" />
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-px bg-zinc-300" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-300" />
              </div>
              <ul className="relative flex h-full items-end gap-1.5 sm:gap-2">
                {props.months.map((row) => (
                  <li
                    key={row.month}
                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 sm:gap-1"
                    title={`${formatPriceSomLabel(row.revenueCents)} выручка · ${formatSignedSomLabel(row.profitCents)} прибыль`}
                    onPointerEnter={() => setActiveMonth(row.month)}
                    onPointerLeave={() => setActiveMonth(null)}
                  >
                    <MonthBar
                      tone="revenue"
                      percent={overviewBarWidthPercent(row.revenueCents, maxCents)}
                    />
                    <MonthBar
                      tone="profit"
                      percent={overviewBarWidthPercent(
                        Math.max(0, row.profitCents),
                        maxCents,
                      )}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="mt-2 flex gap-1.5 pl-[4.75rem] sm:gap-2">
            {props.months.map((row) => (
              <li
                key={row.month}
                className="min-w-0 flex-1 text-center text-[10px] text-zinc-500 sm:text-xs"
                onPointerEnter={() => setActiveMonth(row.month)}
                onPointerLeave={() => setActiveMonth(null)}
              >
                {formatReportMonthShort(row.month, currentYear)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MonthBar(props: { tone: "revenue" | "profit"; percent: number }) {
  if (props.percent <= 0) {
    return <div className="w-2 sm:w-2.5" />;
  }
  return (
    <div
      className={`w-2 rounded-full sm:w-2.5 ${
        props.tone === "revenue" ? "bg-blue-500" : "bg-teal-600"
      }`}
      style={{ height: `${props.percent}%` }}
    />
  );
}
