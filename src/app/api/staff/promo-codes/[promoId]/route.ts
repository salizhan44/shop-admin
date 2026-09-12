import { getStaffSession } from "@/lib/staff-session.server";
import { canManagePromotions } from "@/lib/roles.shared";
import { deletePromoCode, setPromoCodeActive } from "@/lib/promo.server";
import { isPromoActiveBody } from "@/lib/promo.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

type RouteContext = {
  params: Promise<{ promoId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canManagePromotions(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для промокодов" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const { promoId } = await context.params;
  const json: unknown = await request.json().catch(() => null);
  if (!isPromoActiveBody(json)) {
    return Response.json(
      { error: "Укажите, включён ли промокод" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await setPromoCodeActive(promoId, json.isActive);
  if ("error" in result) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ promoCode: result });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canManagePromotions(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для промокодов" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const { promoId } = await context.params;
  const result = await deletePromoCode(promoId);
  if ("error" in result) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json(result);
}
