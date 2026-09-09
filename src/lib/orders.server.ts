import { prisma } from "./prisma.server";
import {
  consumePromoInTransaction,
  isPromoError,
} from "./promo.server";
import {
  notifyOrderConfirmed,
  notifyOrderCreated,
  notifyOrderRejected,
} from "./push.server";
import {
  toOrderPublic,
  toOrderStaffPublic,
  type OrderPublic,
  type OrderStaffPublic,
} from "./orders.shared";

const orderInclude = {
  items: true,
} as const;

class PromoCheckoutError extends Error {
  readonly promoStatus: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PromoCheckoutError";
    this.promoStatus = status;
  }
}

export async function listOrdersForStaff(): Promise<OrderStaffPublic[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { stockQuantity: true },
          },
        },
      },
      customer: {
        select: { name: true, email: true },
      },
    },
  });
  return orders.map((order) =>
    toOrderStaffPublic({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      discountCents: order.discountCents,
      promoCodeText: order.promoCodeText,
      phone: order.phone,
      address: order.address,
      comment: order.comment,
      rejectionReason: order.rejectionReason,
      createdAt: order.createdAt,
      customer: order.customer,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        priceCents: item.priceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        stockQuantityOnHand: item.product.stockQuantity,
      })),
    }),
  );
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<OrderPublic[]> {
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  return orders.map((order) => toOrderPublic(order));
}

async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
}

export async function confirmOrder(
  orderId: string,
): Promise<OrderPublic | { error: string; status: number }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, stockQuantity: true },
          },
        },
      },
    },
  });
  if (!order) {
    return { error: "Заказ не найден", status: 404 };
  }
  if (order.status !== "PENDING") {
    return { error: "Заказ уже обработан", status: 400 };
  }

  for (const item of order.items) {
    if (item.product.stockQuantity < item.quantity) {
      return {
        error: `Недостаточно «${item.productName}»: на складе ${item.product.stockQuantity}, нужно ${item.quantity}`,
        status: 400,
      };
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          rejectionReason: null,
        },
        include: orderInclude,
      });
    });
    const publicOrder = toOrderPublic(updated);
    void notifyOrderConfirmed(updated.customerId, updated.id).catch((error) => {
      console.error("[push] confirm notify failed", error);
    });
    return publicOrder;
  } catch {
    return { error: "Не удалось подтвердить заказ", status: 500 };
  }
}

export async function rejectOrder(
  orderId: string,
  reason: string,
): Promise<OrderPublic | { error: string; status: number }> {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { error: "Укажите причину отклонения", status: 400 };
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return { error: "Заказ не найден", status: 404 };
  }
  if (order.status !== "PENDING") {
    return { error: "Заказ уже обработан", status: 400 };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "REJECTED",
      rejectionReason: trimmed,
    },
    include: orderInclude,
  });
  const publicOrder = toOrderPublic(updated);
  void notifyOrderRejected(updated.customerId, updated.id, trimmed).catch(
    (error) => {
      console.error("[push] reject notify failed", error);
    },
  );
  return publicOrder;
}

export async function createOrderFromCart(
  customerId: string,
  delivery: {
    phone: string;
    address: string;
    comment: string | null;
    promoCode?: string;
  },
): Promise<OrderPublic | { error: string; status: number }> {
  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              costCents: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Корзина пустая", status: 400 };
  }

  for (const item of cart.items) {
    if (!item.product.isActive) {
      return {
        error: `Товар «${item.product.name}» недоступен`,
        status: 400,
      };
    }
  }

  const lineInputs = cart.items.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    priceCents: item.product.priceCents,
    unitCostCents: item.product.costCents,
    quantity: item.quantity,
    lineTotalCents: item.product.priceCents * item.quantity,
  }));
  const subtotalCents = lineInputs.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );
  const requestedCode = delivery.promoCode?.trim() ?? "";

  try {
    const order = await prisma.$transaction(async (tx) => {
      let discountCents = 0;
      let promoCodeId: string | null = null;
      let promoCodeText = "";
      const itemsToCreate = [...lineInputs];

      if (requestedCode) {
        const consumed = await consumePromoInTransaction(tx, {
          customerId,
          code: requestedCode,
          subtotalCents,
        });
        if (isPromoError(consumed)) {
          throw new PromoCheckoutError(consumed.error, consumed.status);
        }
        discountCents = consumed.discountCents;
        promoCodeId = consumed.promoId;
        promoCodeText = consumed.code;
        if (consumed.giftLine) {
          itemsToCreate.push(consumed.giftLine);
        }
      }

      const created = await tx.order.create({
        data: {
          customerId,
          status: "PENDING",
          totalCents: Math.max(0, subtotalCents - discountCents),
          discountCents,
          promoCodeId,
          promoCodeText,
          phone: delivery.phone,
          address: delivery.address,
          comment: delivery.comment,
          items: {
            create: itemsToCreate,
          },
        },
        include: { items: true },
      });
      if (promoCodeId) {
        await tx.promoRedemption.create({
          data: {
            promoCodeId,
            customerId,
            orderId: created.id,
            discountCents,
          },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    const publicOrder = toOrderPublic(order);
    void notifyOrderCreated(customerId, order.id).catch((error) => {
      console.error("[push] create notify failed", error);
    });
    return publicOrder;
  } catch (caught) {
    if (caught instanceof PromoCheckoutError) {
      return { error: caught.message, status: caught.promoStatus };
    }
    throw caught;
  }
}

export function isOrderError(
  value: OrderPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
