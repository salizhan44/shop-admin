export type SelectOption = {
  value: string;
  label: string;
};

export type StatusTone = "pending" | "ok" | "bad" | "neutral";

export const UI_INPUT_CLASS =
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none transition focus:ring-2 focus:ring-zinc-400/40 disabled:opacity-50";

export const UI_TEXTAREA_CLASS = `min-h-20 ${UI_INPUT_CLASS}`;

export const UI_CARD_CLASS =
  "rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70";

export const UI_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60";

export const UI_SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 disabled:opacity-60";

export const UI_DANGER_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200/80 transition hover:bg-red-50 disabled:opacity-60";

export const UI_LABEL_CLASS = "flex flex-col gap-1.5 text-sm text-zinc-700";

export const UI_MUTED_CLASS = "text-sm text-zinc-500";

export function statusBadgeClass(tone: StatusTone): string {
  switch (tone) {
    case "pending":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
    case "ok":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";
    case "bad":
      return "bg-red-50 text-red-800 ring-1 ring-red-100";
    case "neutral":
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80";
  }
}
