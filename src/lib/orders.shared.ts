export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderLinePublic = {
  id: string;
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type OrderLineStaffPublic = OrderLinePublic & {
  stockQuantityOnHand: number;
};

export type OrderPublic = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  rejectionReason: string | null;
  items: OrderLinePublic[];
  createdAt: string;
};

export type OrderStaffPublic = Omit<OrderPublic, "items"> & {
  items: OrderLineStaffPublic[];
  customerName: string;
  customerEmail: string;
};

export type RejectOrderBody = {
  reason: string;
};

export function toOrderLine(input: {
  id: string;
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
}): OrderLinePublic {
  return {
    id: input.id,
    productId: input.productId,
    productName: input.productName,
    priceCents: input.priceCents,
    quantity: input.quantity,
    lineTotalCents: input.lineTotalCents,
  };
}

export function toOrderPublic(input: {
  id: string;
  status: OrderStatus;
  totalCents: number;
  rejectionReason: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    priceCents: number;
    quantity: number;
    lineTotalCents: number;
  }>;
}): OrderPublic {
  return {
    id: input.id,
    status: input.status,
    totalCents: input.totalCents,
    rejectionReason: input.rejectionReason,
    createdAt: input.createdAt.toISOString(),
    items: input.items.map((item) => toOrderLine(item)),
  };
}

export function isOrderPublic(value: unknown): value is OrderPublic {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as {
    id?: unknown;
    status?: unknown;
    totalCents?: unknown;
    items?: unknown;
    createdAt?: unknown;
  };
  return (
    typeof body.id === "string" &&
    typeof body.status === "string" &&
    typeof body.totalCents === "number" &&
    Array.isArray(body.items) &&
    typeof body.createdAt === "string"
  );
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Ожидает подтверждения";
    case "CONFIRMED":
      return "Подтверждён";
    case "REJECTED":
      return "Отклонён";
  }
}

export function isRejectOrderBody(value: unknown): value is RejectOrderBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.reason === "string";
}

export function toOrderLineStaff(input: {
  id: string;
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
  stockQuantityOnHand: number;
}): OrderLineStaffPublic {
  return {
    ...toOrderLine(input),
    stockQuantityOnHand: input.stockQuantityOnHand,
  };
}

export function toOrderStaffPublic(input: {
  id: string;
  status: OrderStatus;
  totalCents: number;
  rejectionReason: string | null;
  createdAt: Date;
  customer: { name: string; email: string };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    priceCents: number;
    quantity: number;
    lineTotalCents: number;
    stockQuantityOnHand: number;
  }>;
}): OrderStaffPublic {
  return {
    id: input.id,
    status: input.status,
    totalCents: input.totalCents,
    rejectionReason: input.rejectionReason,
    createdAt: input.createdAt.toISOString(),
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    items: input.items.map((item) => toOrderLineStaff(item)),
  };
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU");
}
