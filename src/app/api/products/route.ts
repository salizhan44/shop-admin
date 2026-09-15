import { jsonWithCors, corsPreflight } from "@/lib/api-cors.server";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import {
  createCatalogProduct,
  isCreateProductError,
  listActiveProducts,
} from "@/lib/products.server";
import {
  isProductCreateBody,
  parseCostToCents,
  parsePriceToCents,
  parseStockQuantity,
} from "@/lib/products.shared";
import { parseProductDiscount } from "@/lib/product-discount.shared";
import type { ApiErrorBody, ProductPublic } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const products = await listActiveProducts();
  return jsonWithCors({ products } satisfies { products: ProductPublic[] });
}

export async function POST(request: Request) {
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

  const product = await createCatalogProduct({
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
  if (isCreateProductError(product)) {
    return Response.json(
      { error: product.error } satisfies ApiErrorBody,
      { status: 400 },
    );
  }
  return Response.json({ product }, { status: 201 });
}
