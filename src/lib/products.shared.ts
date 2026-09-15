import type { ProductCreateBody, ProductPublic } from "./auth.shared";

export type ProductAdmin = ProductPublic & {
  isActive: boolean;
  stockQuantity: number;
  costCents: number;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  listPriceCents: number;
  discountPercent: number | null;
  discountAmountCents: number | null;
};

export type ProductStockBody = {
  stockQuantity: number;
};

export type ProductWarehousePublic = {
  id: string;
  name: string;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string;
  categoryName: string | null;
};

export type WarehouseSnapshot = {
  productCount: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  retailValueCents: number;
  products: ProductWarehousePublic[];
};

export type CategoryOptionPublic = {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
};

export const PRODUCT_IMAGE_URL_MAX_LENGTH = 1_500_000;

export function isProductCreateBody(value: unknown): value is ProductCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.name !== "string" ||
    typeof body.description !== "string" ||
    typeof body.priceSom !== "string" ||
    typeof body.costSom !== "string" ||
    typeof body.stockQuantity !== "string"
  ) {
    return false;
  }
  if ("categoryId" in body && typeof body.categoryId !== "string") {
    return false;
  }
  if ("categoryName" in body && typeof body.categoryName !== "string") {
    return false;
  }
  if ("subcategoryId" in body && typeof body.subcategoryId !== "string") {
    return false;
  }
  if ("subcategoryName" in body && typeof body.subcategoryName !== "string") {
    return false;
  }
  if ("imageUrl" in body && typeof body.imageUrl !== "string") {
    return false;
  }
  if ("discountKind" in body && typeof body.discountKind !== "string") {
    return false;
  }
  if ("discountPercent" in body && typeof body.discountPercent !== "string") {
    return false;
  }
  if ("discountSom" in body && typeof body.discountSom !== "string") {
    return false;
  }
  return true;
}

export function validateProductImageUrl(imageUrl: string): string | null {
  if (imageUrl.length === 0) {
    return null;
  }
  if (imageUrl.startsWith("/uploads/products/")) {
    return null;
  }
  if (imageUrl.length > PRODUCT_IMAGE_URL_MAX_LENGTH) {
    return "Файл фото слишком большой — выберите изображение поменьше";
  }
  if (!imageUrl.startsWith("data:image/")) {
    return "Нужна картинка JPEG/PNG/WebP";
  }
  return null;
}

export function isProductStockBody(value: unknown): value is ProductStockBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.stockQuantity === "number" &&
    Number.isInteger(body.stockQuantity) &&
    body.stockQuantity >= 0
  );
}

export function parsePriceToCents(priceSom: string): number | null {
  const normalized = priceSom.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents <= 0) {
    return null;
  }
  return cents;
}

/** Себестоимость: 0 и больше. */
export function parseCostToCents(costSom: string): number | null {
  const normalized = costSom.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents < 0) {
    return null;
  }
  return cents;
}

export const UNCATEGORIZED_WAREHOUSE_LABEL = "Без категории";
export const UNCATEGORIZED_SUBCATEGORY_LABEL = "Без подкатегории";
export const UNCATEGORIZED_CATALOG_FILTER_ID = "__uncategorized__";
export const UNCATEGORIZED_SUBCATEGORY_FILTER_ID = "__uncategorized_sub__";

export type CatalogSubcategoryGroup = {
  key: string;
  name: string;
  products: ProductAdmin[];
};

export type CatalogCategoryGroup = {
  key: string;
  name: string;
  products: ProductAdmin[];
  subgroups: CatalogSubcategoryGroup[];
};

function sortCatalogNamedGroups<T extends { name: string }>(
  groups: T[],
  uncategorizedName: string,
): T[] {
  return [...groups].sort((left, right) => {
    if (left.name === uncategorizedName) {
      return 1;
    }
    if (right.name === uncategorizedName) {
      return -1;
    }
    return left.name.localeCompare(right.name, "ru");
  });
}

export function groupCatalogProductsBySubcategory(
  products: ProductAdmin[],
): CatalogSubcategoryGroup[] {
  const byKey = new Map<string, { name: string; products: ProductAdmin[] }>();
  for (const product of products) {
    const name =
      product.subcategoryName?.trim() || UNCATEGORIZED_SUBCATEGORY_LABEL;
    const key = product.subcategoryId ?? UNCATEGORIZED_SUBCATEGORY_FILTER_ID;
    const current = byKey.get(key);
    if (current) {
      current.products.push(product);
    } else {
      byKey.set(key, { name, products: [product] });
    }
  }

  return sortCatalogNamedGroups(
    [...byKey.entries()].map(([key, group]) => ({
      key,
      name: group.name,
      products: group.products,
    })),
    UNCATEGORIZED_SUBCATEGORY_LABEL,
  );
}

export function groupCatalogProductsByCategory(
  products: ProductAdmin[],
): CatalogCategoryGroup[] {
  const byKey = new Map<string, { name: string; products: ProductAdmin[] }>();
  for (const product of products) {
    const name = product.categoryName?.trim() || UNCATEGORIZED_WAREHOUSE_LABEL;
    const key = product.categoryId ?? UNCATEGORIZED_CATALOG_FILTER_ID;
    const current = byKey.get(key);
    if (current) {
      current.products.push(product);
    } else {
      byKey.set(key, { name, products: [product] });
    }
  }

  return sortCatalogNamedGroups(
    [...byKey.entries()].map(([key, group]) => ({
      key,
      name: group.name,
      products: group.products,
      subgroups: groupCatalogProductsBySubcategory(group.products),
    })),
    UNCATEGORIZED_WAREHOUSE_LABEL,
  );
}

export function filterCatalogProducts(
  products: ProductAdmin[],
  categoryId: string | null,
  subcategoryId: string | null,
): ProductAdmin[] {
  return products.filter((product) => {
    if (categoryId === UNCATEGORIZED_CATALOG_FILTER_ID) {
      if (product.categoryId) {
        return false;
      }
    } else if (categoryId && product.categoryId !== categoryId) {
      return false;
    }

    if (subcategoryId === UNCATEGORIZED_SUBCATEGORY_FILTER_ID) {
      if (product.subcategoryId) {
        return false;
      }
    } else if (subcategoryId && product.subcategoryId !== subcategoryId) {
      return false;
    }

    return true;
  });
}

/** Как в приложении: trim + lower case перед применением поиска. */
export function normalizeCatalogSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function isCatalogSearchSubsequence(text: string, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedText = text.toLowerCase();
  let queryIndex = 0;

  for (
    let textIndex = 0;
    textIndex < normalizedText.length && queryIndex < query.length;
    textIndex += 1
  ) {
    if (normalizedText[textIndex] === query[queryIndex]) {
      queryIndex += 1;
    }
  }

  return queryIndex === query.length;
}

export function filterCatalogProductsBySearch(
  products: ProductAdmin[],
  query: string,
): ProductAdmin[] {
  const normalized = normalizeCatalogSearchQuery(query);
  if (!normalized) {
    return products;
  }

  return products.filter((product) =>
    isCatalogSearchSubsequence(product.name, normalized),
  );
}

export type WarehouseCategoryGroup = {
  name: string;
  products: ProductWarehousePublic[];
  totalUnits: number;
};

export function groupWarehouseProductsByCategory(
  products: ProductWarehousePublic[],
): WarehouseCategoryGroup[] {
  const byName = new Map<string, ProductWarehousePublic[]>();
  for (const product of products) {
    const name = product.categoryName?.trim() || UNCATEGORIZED_WAREHOUSE_LABEL;
    const current = byName.get(name) ?? [];
    current.push(product);
    byName.set(name, current);
  }

  return [...byName.entries()]
    .map(([name, grouped]) => ({
      name,
      products: grouped,
      totalUnits: grouped.reduce((sum, product) => sum + product.stockQuantity, 0),
    }))
    .sort((left, right) => {
      if (left.name === UNCATEGORIZED_WAREHOUSE_LABEL) {
        return 1;
      }
      if (right.name === UNCATEGORIZED_WAREHOUSE_LABEL) {
        return -1;
      }
      return left.name.localeCompare(right.name, "ru");
    });
}

export function toWarehouseSnapshot(
  products: ProductWarehousePublic[],
  lowStockThreshold: number,
): WarehouseSnapshot {
  return {
    productCount: products.length,
    totalUnits: products.reduce((sum, product) => sum + product.stockQuantity, 0),
    lowStockCount: products.filter(
      (product) =>
        product.stockQuantity > 0 && product.stockQuantity <= lowStockThreshold,
    ).length,
    outOfStockCount: products.filter((product) => product.stockQuantity === 0)
      .length,
    retailValueCents: products.reduce(
      (sum, product) => sum + product.priceCents * product.stockQuantity,
      0,
    ),
    products,
  };
}

export function formatSignedSomLabel(cents: number): string {
  if (cents < 0) {
    return `−${formatPriceSomLabel(Math.abs(cents))}`;
  }
  return formatPriceSomLabel(cents);
}

export function parseStockQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const quantity = Number(trimmed);
  if (!Number.isInteger(quantity) || quantity < 0) {
    return null;
  }
  return quantity;
}

export function formatPriceSom(priceCents: number): string {
  return String(Math.trunc(priceCents / 100));
}

/** Строка для поля ввода цены (сом), с копейками при необходимости. */
export function formatPriceSomInput(priceCents: number): string {
  const som = priceCents / 100;
  return Number.isInteger(som) ? String(som) : som.toFixed(2);
}

export function formatPriceSomLabel(priceCents: number): string {
  return `${formatPriceSom(priceCents)} сом`;
}
