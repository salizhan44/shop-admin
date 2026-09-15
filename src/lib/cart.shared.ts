import type { ProductPublic } from "./auth.shared";
import {
  compareAtCents,
  salePriceCents,
} from "./product-discount.shared";

export type CartLinePublic = {
  id: string;
  productId: string;
  name: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  imageUrl: string;
  quantity: number;
  lineTotalCents: number;
};

export type CartPublic = {
  items: CartLinePublic[];
  totalCents: number;
};

export type AddToCartBody = {
  productId: string;
};

export type UpdateCartItemBody = {
  quantity: number;
};

export function isAddToCartBody(value: unknown): value is AddToCartBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.productId === "string" && body.productId.length > 0;
}

export function isUpdateCartItemBody(value: unknown): value is UpdateCartItemBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.quantity === "number" && Number.isInteger(body.quantity);
}

export function toCartLine(input: {
  id: string;
  quantity: number;
  product: Pick<
    ProductPublic,
    "id" | "name" | "description" | "imageUrl"
  > & {
    priceCents: number;
    discountPercent: number | null;
    discountAmountCents: number | null;
  };
}): CartLinePublic {
  const unitCents = salePriceCents({
    priceCents: input.product.priceCents,
    discountPercent: input.product.discountPercent,
    discountAmountCents: input.product.discountAmountCents,
  });
  return {
    id: input.id,
    productId: input.product.id,
    name: input.product.name,
    description: input.product.description,
    priceCents: unitCents,
    compareAtCents: compareAtCents({
      priceCents: input.product.priceCents,
      discountPercent: input.product.discountPercent,
      discountAmountCents: input.product.discountAmountCents,
    }),
    imageUrl: input.product.imageUrl,
    quantity: input.quantity,
    lineTotalCents: unitCents * input.quantity,
  };
}

export function sumCartTotal(items: CartLinePublic[]): number {
  return items.reduce((sum, item) => sum + item.lineTotalCents, 0);
}
