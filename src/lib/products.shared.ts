import type { ProductCreateBody, ProductPublic } from "./auth.shared";

export type ProductAdmin = ProductPublic & {
  isActive: boolean;
  stockQuantity: number;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
};

export type ProductStockBody = {
  stockQuantity: number;
};

export type ProductWarehousePublic = {
  id: string;
  name: string;
  stockQuantity: number;
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
