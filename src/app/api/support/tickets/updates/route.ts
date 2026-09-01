import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { checkSupportTicketUpdates } from "@/lib/updates.server";
import { parseSinceQuery, type UpdatesCheckPublic } from "@/lib/updates.shared";

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

  const since = parseSinceQuery(new URL(request.url).searchParams.get("since"));
  const result = await checkSupportTicketUpdates(since, { customerId });
  return jsonWithCors(result satisfies UpdatesCheckPublic);
}
