"use client";

import { useState } from "react";
import {
  formatOrderDate,
  formatOrderShortId,
  orderStatusLabel,
  type OrderStaffPublic,
  type OrderStatus,
} from "@/lib/orders.shared";
import { overviewOrderActivityText } from "@/lib/overview.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import {
  ORDER_CONFIRMED_COLOR,
  UI_CARD_CLASS,
  UI_MUTED_CLASS,
} from "@/lib/ui.shared";
import { ModalDialog } from "@/components/modal-dialog";

export function OverviewActivity(props: { orders: OrderStaffPublic[] }) {
  const [openOrder, setOpenOrder] = useState<OrderStaffPublic | null>(null);

  return (
    <section className={`${UI_CARD_CLASS} px-4 py-4 sm:px-5`}>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Активность
      </h2>
      {props.orders.length === 0 ? (
        <p className={`mt-4 ${UI_MUTED_CLASS}`}>Нет заказов</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100">
          {props.orders.map((order) => (
            <li key={order.id} className="flex items-center gap-3 py-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  order.status === "PENDING"
                    ? "bg-amber-500"
                    : order.status === "REJECTED"
                      ? "bg-red-600"
                      : ""
                }`}
                style={
                  order.status === "CONFIRMED"
                    ? { backgroundColor: ORDER_CONFIRMED_COLOR }
                    : undefined
                }
                aria-hidden
              />
              <p className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                {overviewOrderActivityText(order.status, order.id)}
              </p>
              <button
                type="button"
                aria-label="Открыть заказ"
                onClick={() => setOpenOrder(order)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"
              >
                <span aria-hidden className="text-lg leading-none">
                  &gt;
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <OverviewOrderModal
        order={openOrder}
        onClose={() => setOpenOrder(null)}
      />
    </section>
  );
}

function OverviewOrderModal(props: {
  order: OrderStaffPublic | null;
  onClose: () => void;
}) {
  const order = props.order;
  const title = order
    ? `Заказ ${formatOrderShortId(order.id)}`
    : "Заказ";

  return (
    <ModalDialog open={order !== null} title={title} onClose={props.onClose}>
      {order ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium text-zinc-900">
            {statusPhrase(order.status)}
          </p>
          <p className="text-zinc-700">{order.customerName}</p>
          <p className={UI_MUTED_CLASS}>{formatOrderDate(order.createdAt)}</p>
          <p className="text-zinc-700">{order.phone}</p>
          <p className="text-zinc-700">{order.address}</p>
          {order.comment ? (
            <p className={UI_MUTED_CLASS}>{order.comment}</p>
          ) : null}
          <ul className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
            {order.items.map((item) => (
              <li key={item.id} className="text-zinc-800">
                <p className="font-medium">{item.productName}</p>
                <p className={UI_MUTED_CLASS}>
                  {item.quantity} × {formatPriceSomLabel(item.priceCents)}
                </p>
              </li>
            ))}
          </ul>
          {order.promoCode ? (
            <p className={UI_MUTED_CLASS}>
              {order.promoCode}
              {order.discountCents > 0
                ? ` · −${formatPriceSomLabel(order.discountCents)}`
                : ""}
            </p>
          ) : null}
          <p className="font-semibold text-zinc-900">
            {formatPriceSomLabel(order.totalCents)}
          </p>
          {order.rejectionReason ? (
            <p className="text-red-700">{order.rejectionReason}</p>
          ) : null}
        </div>
      ) : null}
    </ModalDialog>
  );
}

function statusPhrase(status: OrderStatus): string {
  if (status === "CONFIRMED") {
    return "Принят";
  }
  if (status === "REJECTED") {
    return "Отклонён";
  }
  return orderStatusLabel(status);
}
