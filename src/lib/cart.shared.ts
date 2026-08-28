import type { ProductPublic } from "./auth.shared";

export type CartLinePublic = {
  id: string;
  productId: string;
  name: string;
  description: string;
  priceCents: number;
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
  product: ProductPublic;
}): CartLinePublic {
  return {
    id: input.id,
    productId: input.product.id,
    name: input.product.name,
    description: input.product.description,
    priceCents: input.product.priceCents,
    quantity: input.quantity,
    lineTotalCents: input.product.priceCents * input.quantity,
  };
}

export function sumCartTotal(items: CartLinePublic[]): number {
  return items.reduce((sum, item) => sum + item.lineTotalCents, 0);
}
