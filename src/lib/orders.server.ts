import { prisma } from "./prisma.server";
import {
  toOrderPublic,
  toOrderStaffPublic,
  type OrderPublic,
  type OrderStaffPublic,
} from "./orders.shared";

const orderInclude = {
  items: true,
} as const;

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
    return toOrderPublic(updated);
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
  return toOrderPublic(updated);
}

export async function createOrderFromCart(
  customerId: string,
  delivery: {
    phone: string;
    address: string;
    comment: string | null;
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
    quantity: item.quantity,
    lineTotalCents: item.product.priceCents * item.quantity,
  }));
  const totalCents = lineInputs.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerId,
        status: "PENDING",
        totalCents,
        phone: delivery.phone,
        address: delivery.address,
        comment: delivery.comment,
        items: {
          create: lineInputs,
        },
      },
      include: { items: true },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return toOrderPublic(order);
}

export function isOrderError(
  value: OrderPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
