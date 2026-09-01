import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import { isProductError, updateProductStock } from "@/lib/products.server";
import { isProductStockBody } from "@/lib/products.shared";
import type { ApiErrorBody } from "@/lib/auth.shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const session = await getStaffSession();
  if (!session) {
    return Response.json(
      { error: "Нужно войти как сотрудник" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }
  if (!canManageCatalog(session.role)) {
    return Response.json(
      { error: "Недостаточно прав для ассортимента" } satisfies ApiErrorBody,
      { status: 403 },
    );
  }

  const json: unknown = await request.json().catch(() => null);
  if (!isProductStockBody(json)) {
    return Response.json(
      { error: "Укажите остаток — целое число от 0" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const { productId } = await context.params;
  const result = await updateProductStock(productId, json.stockQuantity);
  if (isProductError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }
  return Response.json({ product: result });
}
