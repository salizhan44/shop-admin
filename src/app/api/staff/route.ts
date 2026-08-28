import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff } from "@/lib/roles.shared";
import { createStaffUser, isStaffError } from "@/lib/staff.server";
import { isStaffCreateBody } from "@/lib/staff.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function POST(request: Request) {
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

  const json: unknown = await request.json().catch(() => null);
  if (!isStaffCreateBody(json)) {
    return Response.json(
      { error: "Укажите имя, email, пароль и роль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await createStaffUser(json);
  if (isStaffError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ staff: result }, { status: 201 });
}
