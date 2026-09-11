import type { ReactNode } from "react";

export function PageHeader(props: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={`flex items-center justify-between gap-3 ${
        props.actions ? "" : "hidden lg:flex"
      }`}
    >
      <h1 className="hidden min-w-0 truncate text-2xl font-semibold tracking-tight text-zinc-900 lg:block">
        {props.title}
      </h1>
      {props.actions ? (
        <div className="ml-auto shrink-0 lg:ml-0">{props.actions}</div>
      ) : null}
    </header>
  );
}
