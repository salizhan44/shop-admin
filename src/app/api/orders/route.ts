import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { getCustomerIdFromRequest } from "@/lib/customer-request.server";
import {
  createOrderFromCart,
  isOrderError,
  listOrdersForCustomer,
} from "@/lib/orders.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type { OrderPublic } from "@/lib/orders.shared";

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

  const result = await createOrderFromCart(customerId);
  if (isOrderError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return jsonWithCors(result, { status: 201 });
}
