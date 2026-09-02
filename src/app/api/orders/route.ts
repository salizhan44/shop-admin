import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import {
  createOrderFromCart,
  isOrderError,
  listOrdersForCustomer,
} from "@/lib/orders.server";
import {
  isOrderCheckoutBody,
  normalizeOrderAddress,
  normalizeOrderComment,
  normalizeOrderPhone,
  type OrderPublic,
} from "@/lib/orders.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

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
  const orders = await listOrdersForCustomer(customerId);
  return jsonWithCors({ orders } satisfies { orders: OrderPublic[] });
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
  if (!isOrderCheckoutBody(json)) {
    return jsonWithCors(
      { error: "Укажите телефон и адрес" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const phone = normalizeOrderPhone(json.phone);
  const address = normalizeOrderAddress(json.address);
  if (!phone) {
    return jsonWithCors(
      {
        error: "Укажите корректный телефон (минимум 9 цифр)",
      } satisfies ApiErrorBody,
      { status: 400 },
    );
  }
  if (!address) {
    return jsonWithCors(
      {
        error: "Укажите адрес доставки (не короче 5 символов)",
      } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const comment = normalizeOrderComment(json.comment);
  if (json.comment.trim() && comment === null) {
    return jsonWithCors(
      { error: "Комментарий не длиннее 1000 символов" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await createOrderFromCart(customerId, {
    phone,
    address,
    comment,
  });
  if (isOrderError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result, { status: 201 });
}
