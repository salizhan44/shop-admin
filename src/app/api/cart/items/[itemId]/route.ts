import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import {
  isCartError,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart.server";
import { isUpdateCartItemBody } from "@/lib/cart.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors(
      { error: "Нужно войти" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isUpdateCartItemBody(json)) {
    return jsonWithCors(
      { error: "Укажите количество" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const { itemId } = await context.params;
  const result = await updateCartItemQuantity(customerId, itemId, json.quantity);
  if (isCartError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const customerId = await getCustomerIdFromRequest(request);
  if (!customerId) {
    return jsonWithCors(
      { error: "Нужно войти" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const { itemId } = await context.params;
  const result = await removeCartItem(customerId, itemId);
  if (isCartError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result);
}
