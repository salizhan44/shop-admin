import { PageHeader } from "./page-header";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

export function AccessDenied(props: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={props.title} />
      <p className={`${UI_CARD_CLASS} px-4 py-3 text-sm text-zinc-700`}>
        {props.message}
      </p>
    </div>
  );
}
