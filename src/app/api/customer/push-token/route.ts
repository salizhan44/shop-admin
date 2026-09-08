import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import { upsertCustomerPushToken } from "@/lib/push.server";
import { isRegisterPushTokenBody } from "@/lib/push.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors({ error: "Нужен вход" } satisfies ApiErrorBody, {
      status: 401,
    });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonWithCors({ error: "Некорректный JSON" } satisfies ApiErrorBody, {
      status: 400,
    });
  }

  if (!isRegisterPushTokenBody(json)) {
    return jsonWithCors(
      { error: "Укажите token и platform" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  await upsertCustomerPushToken({
    customerId,
    token: json.token,
    platform: json.platform,
  });

  return jsonWithCors({ ok: true });
}
