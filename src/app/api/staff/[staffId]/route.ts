import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff } from "@/lib/roles.shared";
import { isStaffError, updateStaffUser } from "@/lib/staff.server";
import { isStaffUpdateBody } from "@/lib/staff.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ staffId: string }> },
) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canManageStaff(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для управления сотрудниками" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const { staffId } = await context.params;
  const json: unknown = await request.json().catch(() => null);
  if (!isStaffUpdateBody(json)) {
    return Response.json(
      { error: "Укажите имя, email и роль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await updateStaffUser(staffId, json);
  if (isStaffError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ staff: result });
}
