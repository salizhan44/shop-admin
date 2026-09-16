import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { getOrderForStaff } from "@/lib/orders.server";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type { OrderStaffPublic } from "@/lib/orders.shared";

export async function GET(
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
  const order = await getOrderForStaff(orderId);
  if (!order) {
    return Response.json(
      { error: "Заказ не найден" } satisfies ApiErrorBody,
      { status: 404 },
    );
  }
  return Response.json({ order } satisfies { order: OrderStaffPublic });
}
