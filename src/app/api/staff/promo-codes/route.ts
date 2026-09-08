import { getStaffSession } from "@/lib/staff-session.server";
import { canManagePromotions } from "@/lib/roles.shared";
import { createPromoCode, listPromoCodesForStaff } from "@/lib/promo.server";
import { isPromoCodeCreateBody, type PromoCodeAdmin } from "@/lib/promo.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function GET() {
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
  const promoCodes = await listPromoCodesForStaff();
  return Response.json({ promoCodes } satisfies { promoCodes: PromoCodeAdmin[] });
}

export async function POST(request: Request) {
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

  const json: unknown = await request.json().catch(() => null);
  if (!isPromoCodeCreateBody(json)) {
    return Response.json(
      { error: "Укажите код и тип промокода" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await createPromoCode(json);
  if ("error" in result) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ promoCode: result }, { status: 201 });
}
