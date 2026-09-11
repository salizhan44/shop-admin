import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import { verifyCustomerPassword } from "@/lib/customer-profile.server";
import { isCustomerCurrentPasswordBody } from "@/lib/customer-profile.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  try {
    const customerId = await getCustomerIdFromRequest(request);
    if (!customerId) {
      return jsonWithCors({ error: "Нужен вход" } satisfies ApiErrorBody, {
        status: 401,
      });
    }

    const json: unknown = await request.json().catch(() => null);
    if (!isCustomerCurrentPasswordBody(json)) {
      return jsonWithCors(
        { error: "Укажите текущий пароль" } satisfies ApiErrorBody,
        { status: 400 },
      );
    }

    const result = await verifyCustomerPassword(customerId, json);
    if ("error" in result) {
      const status = result.error === "Не найден" ? 404 : 400;
      return jsonWithCors({ error: result.error } satisfies ApiErrorBody, {
        status,
      });
    }

    return jsonWithCors({ ok: true });
  } catch {
    return jsonWithCors(
      {
        error:
          "Не удалось проверить пароль. Перезапустите сайт (admin) и попробуйте снова.",
      } satisfies ApiErrorBody,
      { status: 500 },
    );
  }
}
