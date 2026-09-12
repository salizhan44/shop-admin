import type { OverviewOrderCounts } from "@/lib/overview.shared";
import { ORDER_CONFIRMED_COLOR } from "@/lib/ui.shared";

export function OverviewStatusCards(props: { counts: OverviewOrderCounts }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      <li>
        <StatusCard
          title="Новые заказы"
          count={props.counts.pending}
          tone="pending"
        />
      </li>
      <li>
        <StatusCard
          title="Отклонены"
          count={props.counts.rejected}
          tone="rejected"
        />
      </li>
      <li>
        <StatusCard
          title="Приняты"
          count={props.counts.confirmed}
          tone="confirmed"
        />
      </li>
    </ul>
  );
}

function StatusCard(props: {
  title: string;
  count: number;
  tone: "pending" | "rejected" | "confirmed";
}) {
  const palette =
    props.tone === "pending"
      ? {
          card: "bg-amber-50 ring-amber-200/80",
          title: "text-amber-800",
          count: "text-amber-900",
          icon: "text-amber-600",
        }
      : props.tone === "rejected"
        ? {
            card: "bg-red-50 ring-red-200/80",
            title: "text-red-800",
            count: "text-red-900",
            icon: "text-red-600",
          }
        : {
            card: "bg-[#3378b3]/10 ring-[#3378b3]/25",
            title: "text-[#3378b3]",
            count: "text-[#245a89]",
            icon: "text-[#3378b3]",
          };

  return (
    <article
      className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-4 shadow-sm ring-1 ${palette.card}`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-medium ${palette.title}`}>{props.title}</p>
        <p className={`mt-2 text-2xl font-semibold tracking-tight ${palette.count}`}>
          {props.count}
        </p>
      </div>
      <span className={`mt-0.5 ${palette.icon}`} aria-hidden>
        {props.tone === "pending" ? (
          <PlusIcon />
        ) : props.tone === "rejected" ? (
          <CrossIcon />
        ) : (
          <CheckIcon color={ORDER_CONFIRMED_COLOR} />
        )}
      </span>
    </article>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 9l6 6M15 9l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon(props: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke={props.color}
        strokeWidth="1.8"
      />
      <path
        d="M8 12.5l2.6 2.6L16.5 9"
        stroke={props.color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
