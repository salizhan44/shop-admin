import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import { addProductToCart, isCartError } from "@/lib/cart.server";
import { isAddToCartBody } from "@/lib/cart.shared";
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
  if (!isAddToCartBody(json)) {
    return jsonWithCors(
      { error: "Укажите товар" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await addProductToCart(customerId, json.productId);
  if (isCartError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result, { status: 201 });
}
