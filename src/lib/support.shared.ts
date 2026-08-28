export const SUPPORT_TICKET_STATUSES = ["OPEN", "CLOSED"] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export type SupportTicketPublic = {
  id: string;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketStaffPublic = SupportTicketPublic & {
  customerName: string;
  customerEmail: string;
};

export type SupportTicketCreateBody = {
  subject: string;
  body: string;
};

export type SupportTicketCloseBody = {
  reply: string;
};

export function isSupportTicketCreateBody(
  value: unknown,
): value is SupportTicketCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.subject === "string" && typeof body.body === "string";
}

export function isSupportTicketCloseBody(
  value: unknown,
): value is SupportTicketCloseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.reply === "string";
}

export function toSupportTicketPublic(input: {
  id: string;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SupportTicketPublic {
  return {
    id: input.id,
    subject: input.subject,
    body: input.body,
    status: input.status,
    staffReply: input.staffReply,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}

export function toSupportTicketStaffPublic(input: {
  id: string;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; email: string };
}): SupportTicketStaffPublic {
  return {
    ...toSupportTicketPublic(input),
    customerName: input.customer.name,
    customerEmail: input.customer.email,
  };
}

export function supportTicketStatusLabel(status: SupportTicketStatus): string {
  switch (status) {
    case "OPEN":
      return "Открыто";
    case "CLOSED":
      return "Закрыто";
  }
}

export function formatSupportTicketDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU");
}
