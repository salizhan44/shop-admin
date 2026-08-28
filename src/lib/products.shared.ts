import type { ProductCreateBody, ProductPublic } from "./auth.shared";

export type ProductAdmin = ProductPublic & {
  isActive: boolean;
};

export function isProductCreateBody(value: unknown): value is ProductCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.name === "string" &&
    typeof body.description === "string" &&
    typeof body.priceRubles === "string"
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

export function formatPriceRubles(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}
