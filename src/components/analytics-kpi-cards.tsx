import { UI_CARD_CLASS } from "@/lib/ui.shared";

export type AnalyticsKpiCard = {
  key: string;
  label: string;
  value: string;
  hint: string;
};

export function AnalyticsKpiCards(props: { cards: AnalyticsKpiCard[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {props.cards.map((card) => (
        <li key={card.key}>
          <article className={`${UI_CARD_CLASS} px-5 py-4`}>
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
