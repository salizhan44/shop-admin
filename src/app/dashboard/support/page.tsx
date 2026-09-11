import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { getLatestSupportTicketUpdatedAt } from "@/lib/updates.server";
import {
  formatSupportTicketDate,
  supportTicketStatusLabel,
  supportTicketStatusTone,
  type SupportTicketStaffPublic,
} from "@/lib/support.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { StatusBadge } from "@/components/status-badge";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { TicketActions } from "./ticket-actions";

function TicketCard(props: { ticket: SupportTicketStaffPublic }) {
  const { ticket } = props;

  return (
    <li className={`${UI_CARD_CLASS} px-5 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{ticket.subject}</p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {ticket.customerName} · {ticket.customerEmail}
          </p>
          <p className={`${UI_MUTED_CLASS} mt-1`}>
            {formatSupportTicketDate(ticket.createdAt)}
          </p>
        </div>
        <StatusBadge
          label={supportTicketStatusLabel(ticket.status)}
          tone={supportTicketStatusTone(ticket.status)}
        />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
        {ticket.body}
      </p>
      {ticket.imageUrls.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {ticket.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-24 w-24 rounded-xl object-contain ring-1 ring-zinc-200/80"
            />
          ))}
        </div>
      ) : null}
      {ticket.staffReply ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600">
          {ticket.staffReply}
        </p>
      ) : null}
      {ticket.status === "OPEN" ? (
        <TicketActions ticketId={ticket.id} />
      ) : null}
    </li>
  );
}

export default async function SupportPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessSupport(session.role)) {
    return (
      <AccessDenied
        title="Поддержка"
        message="У вашей роли нет доступа к обращениям клиентов."
      />
    );
  }

  const tickets = await listSupportTicketsForStaff();
  const latestAt = await getLatestSupportTicketUpdatedAt();
  const open = tickets.filter((ticket) => ticket.status === "OPEN");
  const closed = tickets.filter((ticket) => ticket.status === "CLOSED");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Поддержка"
        actions={
          <RefreshWithUpdates
            pollUrl="/api/staff/support/tickets/updates"
            initialLatestAt={latestAt}
          />
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Открытые · {open.length}
        </h2>
        {open.length === 0 ? (
          <p className={UI_MUTED_CLASS}>Нет обращений</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Закрытые · {closed.length}
        </h2>
        {closed.length === 0 ? (
          <p className={UI_MUTED_CLASS}>Нет закрытых</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {closed.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
