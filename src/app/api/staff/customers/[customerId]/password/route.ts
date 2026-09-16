import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { isStaffCustomerPasswordResetBody } from "@/lib/customers.shared";
import { resetCustomerPasswordByStaff } from "@/lib/customers.server";

export async function POST(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canAccessSupport(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для сброса пароля клиента" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const { customerId } = await context.params;
  const json: unknown = await request.json().catch(() => null);
  if (!isStaffCustomerPasswordResetBody(json)) {
    return Response.json(
      { error: "Укажите новый пароль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await resetCustomerPasswordByStaff(customerId, json.password);
  if ("error" in result) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ ok: true });
}
