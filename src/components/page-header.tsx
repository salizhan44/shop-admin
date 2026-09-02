import type { ReactNode } from "react";

export function PageHeader(props: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
          {props.title}
        </h1>
        {props.description ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            {props.description}
          </p>
        ) : null}
      </div>
      {props.actions ? (
        <div className="shrink-0">{props.actions}</div>
      ) : null}
    </header>
  );
}
