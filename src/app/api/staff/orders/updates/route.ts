import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { checkOrderUpdates } from "@/lib/updates.server";
import { parseSinceQuery, type UpdatesCheckPublic } from "@/lib/updates.shared";

export async function GET(request: Request) {
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

  const since = parseSinceQuery(new URL(request.url).searchParams.get("since"));
  const result = await checkOrderUpdates(since);
  return Response.json(result satisfies UpdatesCheckPublic);
}
