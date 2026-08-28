import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { closeSupportTicket, isSupportError } from "@/lib/support.server";
import { isSupportTicketCloseBody } from "@/lib/support.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function POST(
  request: Request,
  context: { params: Promise<{ ticketId: string }> },
) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canAccessSupport(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для поддержки" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isSupportTicketCloseBody(json)) {
    return Response.json(
      { error: "Укажите ответ клиенту" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const { ticketId } = await context.params;
  const result = await closeSupportTicket(ticketId, json.reply);
  if (isSupportError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ ticket: result });
}
