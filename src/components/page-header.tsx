import type { ReactNode } from "react";

export function PageHeader(props: {
  title: string;
  actions?: ReactNode;
}) {
  if (!props.actions) {
    return null;
  }

  return (
    <header className="flex items-center justify-end gap-3">
      <div className="shrink-0">{props.actions}</div>
    </header>
  );
}
