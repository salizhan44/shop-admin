import type { ProductCreateBody, ProductPublic } from "./auth.shared";

export type ProductAdmin = ProductPublic & {
  isActive: boolean;
  stockQuantity: number;
};

export type ProductStockBody = {
  stockQuantity: number;
};

export type ProductWarehousePublic = {
  id: string;
  name: string;
  stockQuantity: number;
};

export function isProductCreateBody(value: unknown): value is ProductCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.name === "string" &&
    typeof body.description === "string" &&
    typeof body.priceRubles === "string" &&
    typeof body.stockQuantity === "string"
  );
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

export function parsePriceToCents(priceRubles: string): number | null {
  const normalized = priceRubles.trim().replace(",", ".");
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

export function formatPriceRubles(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}
