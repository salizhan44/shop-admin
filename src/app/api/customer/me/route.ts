import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/lib/customer-profile.server";
import { isCustomerProfileUpdateBody } from "@/lib/customer-profile.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  try {
    const customerId = await getCustomerIdFromRequest(request);
    if (!customerId) {
      return jsonWithCors({ error: "Нужен вход" } satisfies ApiErrorBody, {
        status: 401,
      });
    }

    const customer = await getCustomerProfile(customerId);
    if (!customer) {
      return jsonWithCors({ error: "Не найден" } satisfies ApiErrorBody, {
        status: 404,
      });
    }

    return jsonWithCors({ customer });
  } catch {
    return jsonWithCors(
      {
        error:
          "Не удалось загрузить профиль. Перезапустите сайт (admin) и войдите снова.",
      } satisfies ApiErrorBody,
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const customerId = await getCustomerIdFromRequest(request);
    if (!customerId) {
      return jsonWithCors({ error: "Нужен вход" } satisfies ApiErrorBody, {
        status: 401,
      });
    }

    const json: unknown = await request.json().catch(() => null);
    if (!isCustomerProfileUpdateBody(json)) {
      return jsonWithCors(
        { error: "Некорректные данные" } satisfies ApiErrorBody,
        { status: 400 },
      );
    }

    const result = await updateCustomerProfile(customerId, json);
    if ("error" in result) {
      return jsonWithCors({ error: result.error } satisfies ApiErrorBody, {
        status: 400,
      });
    }

    return jsonWithCors({ customer: result.customer });
  } catch {
    return jsonWithCors(
      {
        error:
          "Не удалось сохранить профиль. Перезапустите сайт (admin) и попробуйте снова.",
      } satisfies ApiErrorBody,
      { status: 500 },
    );
  }
}
