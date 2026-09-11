import { statusBadgeClass, type StatusTone } from "@/lib/ui.shared";

export function StatusBadge(props: { label: string; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(props.tone)}`}
    >
      {props.label}
    </span>
  );
}
