import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import {
  deactivateCatalogProduct,
  isProductError,
  updateCatalogProduct,
} from "@/lib/products.server";
import {
  isProductCreateBody,
  parseCostToCents,
  parsePriceToCents,
  parseStockQuantity,
} from "@/lib/products.shared";
import { parseProductDiscount } from "@/lib/product-discount.shared";
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
  if (!isProductCreateBody(json)) {
    return Response.json(
      { error: "Укажите название и цену" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const name = json.name.trim();
  const description = json.description.trim();
  const priceCents = parsePriceToCents(json.priceSom);
  const costCents = parseCostToCents(json.costSom);
  const stockQuantity = parseStockQuantity(json.stockQuantity);
  if (
    !name ||
    priceCents === null ||
    costCents === null ||
    stockQuantity === null
  ) {
    return Response.json(
      {
        error:
          "Название обязательно, цена — число больше 0, себестоимость — число от 0, остаток — целое число от 0",
      } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const discount = parseProductDiscount({
    kind: json.discountKind ?? "none",
    percentText: json.discountPercent ?? "",
    amountSom: json.discountSom ?? "",
    priceCents,
  });
  if ("error" in discount) {
    return Response.json(
      { error: discount.error } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const { productId } = await context.params;
  const result = await updateCatalogProduct(productId, {
    name,
    description,
    priceCents,
    costCents,
    stockQuantity,
    categoryId: json.categoryId,
    categoryName: json.categoryName,
    subcategoryId: json.subcategoryId,
    subcategoryName: json.subcategoryName,
    imageUrl: json.imageUrl,
    discountPercent: discount.discountPercent,
    discountAmountCents: discount.discountAmountCents,
  });
  if (isProductError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }

  return Response.json({ product: result });
}

export async function DELETE(
  _request: Request,
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

  const { productId } = await context.params;
  const result = await deactivateCatalogProduct(productId);
  if (isProductError(result)) {
    return Response.json(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }

  return Response.json({ product: result });
}
