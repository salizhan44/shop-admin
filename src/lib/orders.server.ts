import { prisma } from "./prisma.server";
import {
  consumePromoInTransaction,
  isPromoError,
} from "./promo.server";
import {
  awardEarnedPoints,
  refundCustomerPoints,
  spendCustomerPoints,
} from "./loyalty.server";
import {
  clampLoyaltyPointsToSpend,
  payableAfterLoyaltyCents,
} from "./loyalty.shared";
import { salePriceCents } from "./product-discount.shared";
import { getShopPoint, resolveDeliveryForAddress } from "./delivery.server";
import {
  notifyOrderConfirmed,
  notifyOrderCreated,
  notifyOrderRejected,
} from "./push.server";
import {
  toOrderPublic,
  toOrderStaffListRow,
  toOrderStaffPublic,
  type OrderPublic,
  type OrderStaffListRow,
  type OrderStaffPublic,
} from "./orders.shared";
import {
  OVERVIEW_ACTIVITY_LIMIT,
  type OverviewOrderCounts,
} from "./overview.shared";

const orderInclude = {
  items: true,
} as const;

function withShop<T extends object>(order: T) {
  const shop = getShopPoint();
  return { ...order, shopLat: shop.lat, shopLng: shop.lng };
}

async function attachOrderDelivery(
  orderId: string,
  address: string,
): Promise<void> {
  const resolved = await resolveDeliveryForAddress(address);
  if (!resolved) {
    return;
  }
  await prisma.order.update({
    where: { id: orderId },
    data: resolved,
  });
}

class CheckoutDomainError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CheckoutDomainError";
    this.status = status;
  }
}

const staffOrderCustomerSelect = {
  select: { name: true, email: true },
} as const;

const staffOrderDetailInclude = {
  items: {
    include: {
      product: {
        select: { stockQuantity: true },
      },
    },
  },
  customer: staffOrderCustomerSelect,
} as const;

function toStaffOrderDto(order: {
  id: string;
  status: OrderStaffPublic["status"];
  totalCents: number;
  discountCents: number;
  pointsSpent: number;
  pointsEarned: number;
  promoCodeText: string;
  phone: string;
  address: string;
  comment: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  destLat: number | null;
  destLng: number | null;
  etaMinutes: number | null;
  customer: { name: string; email: string };
  items?: ReadonlyArray<{
    id: string;
    productId: string;
    productName: string;
    priceCents: number;
    quantity: number;
    lineTotalCents: number;
    product: { stockQuantity: number };
  }>;
}): OrderStaffPublic {
  const shop = getShopPoint();
  return toOrderStaffPublic({
    id: order.id,
    status: order.status,
    totalCents: order.totalCents,
    discountCents: order.discountCents,
    pointsSpent: order.pointsSpent,
    pointsEarned: order.pointsEarned,
    promoCodeText: order.promoCodeText,
    phone: order.phone,
    address: order.address,
    comment: order.comment,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt,
    destLat: order.destLat,
    destLng: order.destLng,
    etaMinutes: order.etaMinutes,
    shopLat: shop.lat,
    shopLng: shop.lng,
    customer: order.customer,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      priceCents: item.priceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      stockQuantityOnHand: item.product.stockQuantity,
    })),
  });
}

export async function listOrdersForStaff(): Promise<OrderStaffListRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      customer: {
        select: { name: true },
      },
    },
  });
  return orders.map((order) =>
    toOrderStaffListRow({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      customerName: order.customer.name,
    }),
  );
}

export async function getOrderForStaff(
  orderId: string,
): Promise<OrderStaffPublic | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: staffOrderDetailInclude,
  });
  if (!order) {
    return null;
  }
  return toStaffOrderDto(order);
}

export async function listOverviewForStaff(): Promise<{
  counts: OverviewOrderCounts;
  activity: OrderStaffPublic[];
}> {
  const [grouped, recent] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: OVERVIEW_ACTIVITY_LIMIT,
      include: staffOrderDetailInclude,
    }),
  ]);

  const counts: OverviewOrderCounts = {
    pending: 0,
    confirmed: 0,
    rejected: 0,
  };
  for (const row of grouped) {
    if (row.status === "PENDING") {
      counts.pending = row._count._all;
    } else if (row.status === "CONFIRMED") {
      counts.confirmed = row._count._all;
    } else {
      counts.rejected = row._count._all;
    }
  }

  return {
    counts,
    activity: recent.map((order) => toStaffOrderDto(order)),
  };
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<OrderPublic[]> {
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  return orders.map((order) => toOrderPublic(withShop(order)));
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
      const earned = await awardEarnedPoints(tx, {
        customerId: order.customerId,
        cashPaidCents: order.totalCents,
      });
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          rejectionReason: null,
          pointsEarned: earned,
        },
        include: orderInclude,
      });
    });
    await attachOrderDelivery(updated.id, updated.address);
    const withGeo = (await getOrderById(updated.id)) ?? updated;
    const publicOrder = toOrderPublic(withShop(withGeo));
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

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        rejectionReason: trimmed,
      },
      include: orderInclude,
    });
    await refundCustomerPoints(tx, order.customerId, order.pointsSpent);
    return next;
  });
  const publicOrder = toOrderPublic(withShop(updated));
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
    pointsToSpend?: number;
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
              discountPercent: true,
              discountAmountCents: true,
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

  const lineInputs = cart.items.map((item) => {
    const unitCents = salePriceCents({
      priceCents: item.product.priceCents,
      discountPercent: item.product.discountPercent,
      discountAmountCents: item.product.discountAmountCents,
    });
    return {
      productId: item.product.id,
      productName: item.product.name,
      priceCents: unitCents,
      unitCostCents: item.product.costCents,
      quantity: item.quantity,
      lineTotalCents: unitCents * item.quantity,
    };
  });
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
          throw new CheckoutDomainError(consumed.error, consumed.status);
        }
        discountCents = consumed.discountCents;
        promoCodeId = consumed.promoId;
        promoCodeText = consumed.code;
        if (consumed.giftLine) {
          itemsToCreate.push(consumed.giftLine);
        }
      }

      const afterPromoCents = Math.max(0, subtotalCents - discountCents);
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { loyaltyPoints: true },
      });
      if (!customer) {
        throw new CheckoutDomainError("Клиент не найден", 404);
      }
      const pointsSpent = clampLoyaltyPointsToSpend({
        requested: delivery.pointsToSpend ?? 0,
        balance: customer.loyaltyPoints,
        payableCents: afterPromoCents,
      });
      const spent = await spendCustomerPoints(tx, customerId, pointsSpent);
      if ("error" in spent) {
        throw new CheckoutDomainError(spent.error, spent.status);
      }

      const created = await tx.order.create({
        data: {
          customerId,
          status: "PENDING",
          totalCents: payableAfterLoyaltyCents(afterPromoCents, pointsSpent),
          discountCents,
          pointsSpent,
          phone: delivery.phone,
          address: delivery.address,
          comment: delivery.comment,
          promoCodeId,
          promoCodeText,
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

    await attachOrderDelivery(order.id, order.address);
    const withGeo = (await getOrderById(order.id)) ?? order;
    const publicOrder = toOrderPublic(withShop(withGeo));
    void notifyOrderCreated(customerId, order.id).catch((error) => {
      console.error("[push] create notify failed", error);
    });
    return publicOrder;
  } catch (caught) {
    if (caught instanceof CheckoutDomainError) {
      return { error: caught.message, status: caught.status };
    }
    throw caught;
  }
}

export function isOrderError(
  value: OrderPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
