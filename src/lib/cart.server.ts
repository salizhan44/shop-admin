import { prisma } from "./prisma.server";
import {
  sumCartTotal,
  toCartLine,
  type CartPublic,
} from "./cart.shared";

const MAX_QUANTITY = 99;

export async function getCartForCustomer(customerId: string): Promise<CartPublic> {
  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              priceCents: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return { items: [], totalCents: 0 };
  }

  const items = cart.items.map((item) =>
    toCartLine({
      id: item.id,
      quantity: item.quantity,
      product: item.product,
    }),
  );
  return { items, totalCents: sumCartTotal(items) };
}

async function getOrCreateCartId(customerId: string): Promise<string> {
  const existing = await prisma.cart.findUnique({
    where: { customerId },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }
  const created = await prisma.cart.create({
    data: { customerId },
    select: { id: true },
  });
  return created.id;
}

export async function addProductToCart(
  customerId: string,
  productId: string,
): Promise<CartPublic | { error: string; status: number }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });
  if (!product || !product.isActive) {
    return { error: "Товар недоступен", status: 404 };
  }

  const cartId = await getOrCreateCartId(customerId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + 1, MAX_QUANTITY);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, quantity: 1 },
    });
  }

  return getCartForCustomer(customerId);
}

export async function updateCartItemQuantity(
  customerId: string,
  itemId: string,
  quantity: number,
): Promise<CartPublic | { error: string; status: number }> {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { customerId } },
  });
  if (!item) {
    return { error: "Позиция не найдена", status: 404 };
  }

  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return getCartForCustomer(customerId);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: Math.min(quantity, MAX_QUANTITY) },
  });
  return getCartForCustomer(customerId);
}

export async function removeCartItem(
  customerId: string,
  itemId: string,
): Promise<CartPublic | { error: string; status: number }> {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { customerId } },
  });
  if (!item) {
    return { error: "Позиция не найдена", status: 404 };
  }
  await prisma.cartItem.delete({ where: { id: item.id } });
  return getCartForCustomer(customerId);
}

export function isCartError(
  value: CartPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
