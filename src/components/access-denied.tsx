import { PageHeader } from "./page-header";

export function AccessDenied(props: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={props.title} />
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
        {props.message}
      </p>
    </div>
  );
}
