import {
  ANALYTICS_TREND_DOWN_COLOR,
  ANALYTICS_TREND_UP_COLOR,
  analyticsTrendDirection,
  formatWeekChangePercent,
  type AnalyticsTrendDirection,
  type AnalyticsWeekSnapshot,
  type WeekChange,
} from "@/lib/analytics-week.shared";
import { formatPriceSomLabel, formatSignedSomLabel } from "@/lib/products.shared";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

export function AnalyticsWeekCards(props: { snapshot: AnalyticsWeekSnapshot }) {
  const cards: Array<{ key: string; title: string; change: WeekChange }> = [
    { key: "overall", title: "Всего", change: props.snapshot.overall },
    ...props.snapshot.categories.map((card) => ({
      key: card.categoryId,
      title: card.categoryName,
      change: card,
    })),
    {
      key: props.snapshot.uncategorized.categoryId,
      title: props.snapshot.uncategorized.categoryName,
      change: props.snapshot.uncategorized,
    },
  ];

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <li key={card.key}>
          <WeekMetricCard title={card.title} change={card.change} />
        </li>
      ))}
    </ul>
  );
}

function WeekMetricCard(props: { title: string; change: WeekChange }) {
  return (
    <article className={`${UI_CARD_CLASS} flex h-full flex-col gap-3 px-4 py-3`}>
      <h3 className="truncate text-sm font-semibold text-zinc-900">
        {props.title}
      </h3>
      <MetricRow
        label="Выручка"
        amount={formatPriceSomLabel(props.change.current.revenueCents)}
        changePercent={props.change.revenueChangePercent}
        currentValue={props.change.current.revenueCents}
      />
      <MetricRow
        label="Прибыль"
        amount={formatSignedSomLabel(props.change.current.profitCents)}
        changePercent={props.change.profitChangePercent}
        currentValue={props.change.current.profitCents}
      />
    </article>
  );
}

function MetricRow(props: {
  label: string;
  amount: string;
  changePercent: number | null;
  currentValue: number;
}) {
  const direction = analyticsTrendDirection(
    props.changePercent,
    props.currentValue,
  );
  const color =
    direction === "up"
      ? ANALYTICS_TREND_UP_COLOR
      : direction === "down"
        ? ANALYTICS_TREND_DOWN_COLOR
        : undefined;

  return (
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{props.label}</p>
        <p className="truncate text-sm font-semibold text-zinc-900">
          {props.amount}
        </p>
      </div>
      <p
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold"
        style={color ? { color } : { color: "#71717a" }}
      >
        {direction !== "flat" ? <TrendArrow direction={direction} /> : null}
        <span>{formatWeekChangePercent(props.changePercent)}</span>
      </p>
    </div>
  );
}

function TrendArrow(props: { direction: Exclude<AnalyticsTrendDirection, "flat"> }) {
  const down = props.direction === "down";
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
      {down ? (
        <path
          d="M6 2v8M3 7.5 6 10.5 9 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 10V2M3 4.5 6 1.5 9 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
