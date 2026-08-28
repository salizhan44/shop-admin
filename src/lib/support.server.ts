import { prisma } from "./prisma.server";
import {
  toSupportTicketPublic,
  toSupportTicketStaffPublic,
  type SupportTicketPublic,
  type SupportTicketStaffPublic,
} from "./support.shared";

export async function listSupportTicketsForCustomer(
  customerId: string,
): Promise<SupportTicketPublic[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
  return tickets.map((ticket) => toSupportTicketPublic(ticket));
}

export async function listSupportTicketsForStaff(): Promise<
  SupportTicketStaffPublic[]
> {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true },
      },
    },
  });
  return tickets.map((ticket) => toSupportTicketStaffPublic(ticket));
}

export async function createSupportTicket(
  customerId: string,
  input: { subject: string; body: string },
): Promise<SupportTicketPublic | { error: string; status: number }> {
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!subject || !body) {
    return { error: "Укажите тему и текст обращения", status: 400 };
  }
  if (subject.length > 200) {
    return { error: "Тема не длиннее 200 символов", status: 400 };
  }
  if (body.length > 5000) {
    return { error: "Текст не длиннее 5000 символов", status: 400 };
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      customerId,
      subject,
      body,
      status: "OPEN",
    },
  });
  return toSupportTicketPublic(ticket);
}

export async function closeSupportTicket(
  ticketId: string,
  reply: string,
): Promise<SupportTicketPublic | { error: string; status: number }> {
  const trimmedReply = reply.trim();
  if (!trimmedReply) {
    return { error: "Укажите ответ клиенту", status: 400 };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    return { error: "Обращение не найдено", status: 404 };
  }
  if (ticket.status !== "OPEN") {
    return { error: "Обращение уже закрыто", status: 400 };
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "CLOSED",
      staffReply: trimmedReply,
    },
  });
  return toSupportTicketPublic(updated);
}

export function isSupportError(
  value: SupportTicketPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
