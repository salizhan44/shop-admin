import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import {
  formatSupportTicketDate,
  supportTicketStatusLabel,
  type SupportTicketStaffPublic,
} from "@/lib/support.shared";
import { TicketActions } from "./ticket-actions";

function TicketCard(props: { ticket: SupportTicketStaffPublic }) {
  const { ticket } = props;

  return (
    <li className="rounded border border-zinc-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{ticket.subject}</p>
          <p className="text-sm text-zinc-600">
            {ticket.customerName} · {ticket.customerEmail}
          </p>
          <p className="text-sm text-zinc-600">
            {formatSupportTicketDate(ticket.createdAt)}
          </p>
        </div>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {supportTicketStatusLabel(ticket.status)}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
        {ticket.body}
      </p>
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
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Поддержка</h1>
        <p className="text-sm text-zinc-700">
          У вашей роли нет доступа к обращениям клиентов.
        </p>
      </main>
    );
  }

  const tickets = await listSupportTicketsForStaff();
  const open = tickets.filter((ticket) => ticket.status === "OPEN");
  const closed = tickets.filter((ticket) => ticket.status === "CLOSED");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Поддержка</h1>
        <p className="text-sm text-zinc-600">
          Обращения из приложения. Ответьте клиенту и закройте обращение.
        </p>
      </header>

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
    </main>
  );
}
