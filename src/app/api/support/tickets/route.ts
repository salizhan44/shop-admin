import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import {
  createSupportTicket,
  isSupportError,
  listSupportTicketsForCustomer,
} from "@/lib/support.server";
import { isSupportTicketCreateBody } from "@/lib/support.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type { SupportTicketPublic } from "@/lib/support.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors(
      { error: "Нужно войти" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  const tickets = await listSupportTicketsForCustomer(customerId);
  return jsonWithCors({ tickets } satisfies { tickets: SupportTicketPublic[] });
}

export async function POST(request: Request) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors(
      { error: "Нужно войти" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isSupportTicketCreateBody(json)) {
    return jsonWithCors(
      { error: "Укажите тему и текст" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await createSupportTicket(customerId, json);
  if (isSupportError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result, { status: 201 });
}
