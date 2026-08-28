import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { confirmOrder, isOrderError } from "@/lib/orders.server";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function POST(
  _request: Request,
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

  const { orderId } = await context.params;
  const result = await confirmOrder(orderId);
  if (isOrderError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ order: result });
}
