import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import { addCustomerAppSeconds } from "@/lib/customer-profile.server";
import { isSessionPingBody } from "@/lib/session-time.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors({ error: "Нужно войти" } satisfies ApiErrorBody, {
      status: 401,
    });
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isSessionPingBody(json)) {
    return jsonWithCors(
      { error: "Укажите секунды сессии" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await addCustomerAppSeconds(customerId, json.seconds);
  if ("error" in result) {
    return jsonWithCors({ error: result.error } satisfies ApiErrorBody, {
      status: 400,
    });
  }
  return jsonWithCors({ ok: true });
}
