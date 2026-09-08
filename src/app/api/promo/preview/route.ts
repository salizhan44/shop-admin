import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import { getCartForCustomer } from "@/lib/cart.server";
import { isPromoError, previewPromoForCustomer } from "@/lib/promo.server";
import { isPromoPreviewBody, type PromoQuotePublic } from "@/lib/promo.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
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
  if (!isPromoPreviewBody(json)) {
    return jsonWithCors(
      { error: "Введите промокод" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const cart = await getCartForCustomer(customerId);
  if (cart.items.length === 0) {
    return jsonWithCors(
      { error: "Корзина пустая" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await previewPromoForCustomer({
    customerId,
    code: json.code,
    subtotalCents: cart.totalCents,
  });
  if (isPromoError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result satisfies PromoQuotePublic);
}
