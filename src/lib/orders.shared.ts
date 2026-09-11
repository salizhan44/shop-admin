import type { StatusTone } from "./ui.shared";

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
  discountCents: number;
  promoCode: string;
  phone: string;
  address: string;
  comment: string | null;
  rejectionReason: string | null;
  items: OrderLinePublic[];
  createdAt: string;
};

export type OrderStaffPublic = Omit<OrderPublic, "items"> & {
  items: OrderLineStaffPublic[];
  customerName: string;
  customerEmail: string;
};

export type OrderCheckoutBody = {
  phone: string;
  address: string;
  comment: string;
  promoCode?: string;
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
  discountCents?: number;
  promoCodeText?: string;
  phone: string;
  address: string;
  comment: string | null;
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
    discountCents: input.discountCents ?? 0,
    promoCode: input.promoCodeText ?? "",
    phone: input.phone,
    address: input.address,
    comment: input.comment,
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
    discountCents?: unknown;
    promoCode?: unknown;
    phone?: unknown;
    address?: unknown;
    items?: unknown;
    createdAt?: unknown;
  };
  const discountCents =
    typeof body.discountCents === "number" ? body.discountCents : 0;
  const promoCode = typeof body.promoCode === "string" ? body.promoCode : "";
  return (
    typeof body.id === "string" &&
    typeof body.status === "string" &&
    typeof body.totalCents === "number" &&
    discountCents >= 0 &&
    typeof promoCode === "string" &&
    typeof body.phone === "string" &&
    typeof body.address === "string" &&
    Array.isArray(body.items) &&
    typeof body.createdAt === "string"
  );
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Ожидает";
    case "CONFIRMED":
      return "Подтверждён";
    case "REJECTED":
      return "Отклонён";
  }
}

export function orderStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case "PENDING":
      return "pending";
    case "CONFIRMED":
      return "ok";
    case "REJECTED":
      return "bad";
  }
}

export function isRejectOrderBody(value: unknown): value is RejectOrderBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.reason === "string";
}

export function isOrderCheckoutBody(value: unknown): value is OrderCheckoutBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.phone !== "string" ||
    typeof body.address !== "string" ||
    typeof body.comment !== "string"
  ) {
    return false;
  }
  if ("promoCode" in body && typeof body.promoCode !== "string") {
    return false;
  }
  return true;
}

export function normalizeOrderPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) {
    return null;
  }
  if (trimmed.length > 40) {
    return null;
  }
  return trimmed;
}

export function normalizeOrderAddress(address: string): string | null {
  const trimmed = address.trim();
  if (trimmed.length < 5 || trimmed.length > 500) {
    return null;
  }
  return trimmed;
}

export function normalizeOrderComment(comment: string): string | null {
  const trimmed = comment.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 1000) {
    return null;
  }
  return trimmed;
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
  discountCents?: number;
  promoCodeText?: string;
  phone: string;
  address: string;
  comment: string | null;
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
    ...toOrderPublic(input),
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    items: input.items.map((item) => toOrderLineStaff(item)),
  };
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU");
}
