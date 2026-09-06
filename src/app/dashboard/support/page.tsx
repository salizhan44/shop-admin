import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { getLatestSupportTicketUpdatedAt } from "@/lib/updates.server";
import {
  formatSupportTicketDate,
  supportTicketStatusLabel,
  type SupportTicketStaffPublic,
} from "@/lib/support.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { TicketActions } from "./ticket-actions";

function TicketCard(props: { ticket: SupportTicketStaffPublic }) {
  const { ticket } = props;

  return (
    <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{ticket.subject}</p>
          <p className="text-sm text-zinc-600">
            {ticket.customerName} · {ticket.customerEmail}
          </p>
          <p className="text-sm text-zinc-600">
            {formatSupportTicketDate(ticket.createdAt)}
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {supportTicketStatusLabel(ticket.status)}
        </span>
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
              className="h-24 w-24 rounded-lg object-contain ring-1 ring-zinc-200"
            />
          ))}
        </div>
      ) : null}
      {ticket.staffReply ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
          Ответ: {ticket.staffReply}
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
        description="Обращения из приложения. Ответьте клиенту и закройте обращение."
        actions={
          <RefreshWithUpdates
            pollUrl="/api/staff/support/tickets/updates"
            initialLatestAt={latestAt}
          />
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Открытые ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-zinc-600">Новых обращений нет.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Закрытые ({closed.length})</h2>
        {closed.length === 0 ? (
          <p className="text-sm text-zinc-600">История пока пустая.</p>
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
