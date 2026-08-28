import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { isOrderError, rejectOrder } from "@/lib/orders.server";
import { isRejectOrderBody } from "@/lib/orders.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canAccessWarehouse(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для заказов" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isRejectOrderBody(json)) {
    return Response.json(
      { error: "Укажите причину отклонения" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const { orderId } = await context.params;
  const result = await rejectOrder(orderId, json.reason);
  if (isOrderError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ order: result });
}
