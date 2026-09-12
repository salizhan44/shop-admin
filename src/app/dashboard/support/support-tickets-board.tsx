"use client";

import { useMemo, useState } from "react";
import {
  SUPPORT_TICKET_LIST_FILTERS,
  filterSupportTickets,
  formatSupportTicketDate,
  supportTicketStatusLabel,
  supportTicketStatusTone,
  type SupportTicketListFilter,
  type SupportTicketStaffPublic,
} from "@/lib/support.shared";
import { ADMIN_MENU_BG, UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { StatusBadge } from "@/components/status-badge";
import { TicketActions } from "./ticket-actions";

export function SupportTicketsBoard(props: {
  tickets: SupportTicketStaffPublic[];
  latestAt: string | null;
}) {
  const [filter, setFilter] = useState<SupportTicketListFilter>("OPEN");
  const visible = useMemo(
    () => filterSupportTickets(props.tickets, filter),
    [props.tickets, filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {SUPPORT_TICKET_LIST_FILTERS.map((option) => {
            const active = option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={
                  active
                    ? "rounded-xl px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700"
                }
                style={
                  active ? { backgroundColor: ADMIN_MENU_BG } : undefined
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="shrink-0">
          <RefreshWithUpdates
            pollUrl="/api/staff/support/tickets/updates"
            initialLatestAt={props.latestAt}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={UI_MUTED_CLASS}>
          {filter === "OPEN" ? "Нет обращений" : "Нет закрытых"}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
}

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
