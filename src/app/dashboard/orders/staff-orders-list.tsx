"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  STAFF_ORDER_LIST_FILTERS,
  filterStaffOrders,
  formatOrderDate,
  formatOrderShortId,
  orderStatusLabel,
  type OrderStaffPublic,
  type OrderStatus,
  type StaffOrderListFilter,
} from "@/lib/orders.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import {
  ADMIN_MENU_BG,
  ORDER_CONFIRMED_COLOR,
  UI_MUTED_CLASS,
} from "@/lib/ui.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { OrderActions } from "./order-actions";
import { OrderItemsModal } from "./order-items-modal";

const TABLE_MIN_WIDTH_CLASS = "min-w-[62rem]";
const ROW_GRID =
  "grid w-full grid-cols-[6.5rem_minmax(8rem,1.2fr)_6.5rem_8.5rem_6.5rem_10rem_6.25rem] items-center gap-3 px-5";
const CELL_TEXT = "whitespace-nowrap text-sm";

export function StaffOrdersList(props: {
  orders: OrderStaffPublic[];
  latestAt: string | null;
}) {
  const [filter, setFilter] = useState<StaffOrderListFilter>("all");
  const [itemsOrder, setItemsOrder] = useState<OrderStaffPublic | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    function onWheel(event: WheelEvent) {
      const node = scrollerRef.current;
      if (!node) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest('[role="dialog"]')) {
        return;
      }
      if (node.scrollWidth <= node.clientWidth + 1) {
        return;
      }
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const max = node.scrollWidth - node.clientWidth;
      const next = Math.min(max, Math.max(0, node.scrollLeft + delta));
      if (Math.abs(next - node.scrollLeft) < 1) {
        return;
      }
      event.preventDefault();
      node.scrollLeft = next;
    }

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("wheel", onWheel);
    };
  }, []);

  const visible = useMemo(
    () => filterStaffOrders(props.orders, filter),
    [props.orders, filter],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {STAFF_ORDER_LIST_FILTERS.map((option) => {
            const active = option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={
                  active
                    ? "rounded-xl px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700"
                }
                style={
                  active
                    ? { backgroundColor: ADMIN_MENU_BG }
                    : undefined
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="shrink-0">
          <RefreshWithUpdates
            pollUrl="/api/staff/orders/updates"
            initialLatestAt={props.latestAt}
          />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="min-w-0 overflow-x-hidden rounded-2xl bg-zinc-100 shadow-[0_10px_28px_rgba(6,30,58,0.10)] ring-1 ring-zinc-200/70"
      >
        <div className={`${TABLE_MIN_WIDTH_CLASS} w-full`}>
          <div className={`${ROW_GRID} bg-zinc-100 py-2.5 text-sm text-zinc-500`}>
            <span className="whitespace-nowrap">ID</span>
            <span className="whitespace-nowrap">Клиент</span>
            <span className="whitespace-nowrap">Состав</span>
            <span className="whitespace-nowrap">Статус</span>
            <span className="whitespace-nowrap">Сумма</span>
            <span className="whitespace-nowrap">Дата</span>
            <span>
              <span className="sr-only">Действия</span>
            </span>
          </div>
          {visible.length === 0 ? (
            <div className="bg-white px-5 py-8">
              <p className={UI_MUTED_CLASS}>Нет заказов</p>
            </div>
          ) : (
            <ul className="w-full bg-white">
              {visible.map((order) => (
                <li
                  key={order.id}
                  className={`${ROW_GRID} border-t border-zinc-100 py-3`}
                >
                  <p className={`${CELL_TEXT} font-medium text-zinc-900`}>
                    {formatOrderShortId(order.id)}
                  </p>
                  <p className={`${CELL_TEXT} text-zinc-800`}>
                    {order.customerName}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setItemsOrder(order)}
                      className="flex h-9 w-full items-center justify-center whitespace-nowrap rounded-xl bg-white px-2 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50"
                    >
                      Состав
                    </button>
                  </div>
                  <div>
                    <OrderStatusChip status={order.status} />
                  </div>
                  <p className={`${CELL_TEXT} font-medium text-zinc-900`}>
                    {formatPriceSomLabel(order.totalCents)}
                  </p>
                  <p className={`${CELL_TEXT} text-zinc-600`}>
                    {formatOrderDate(order.createdAt)}
                  </p>
                  <OrderActions
                    orderId={order.id}
                    disabled={order.status !== "PENDING"}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <OrderItemsModal
        order={itemsOrder}
        onClose={() => setItemsOrder(null)}
      />
    </div>
  );
}

function OrderStatusChip(props: { status: OrderStatus }) {
  const label = orderStatusLabel(props.status);
  const confirmed = props.status === "CONFIRMED";
  const toneClass = confirmed
    ? "text-white"
    : props.status === "PENDING"
      ? "bg-amber-500 text-white"
      : "bg-red-600 text-white";

  return (
    <span
      title={label}
      className={`flex h-9 w-full items-center justify-center whitespace-nowrap rounded-xl px-2 text-sm font-medium ${toneClass}`}
      style={
        confirmed ? { backgroundColor: ORDER_CONFIRMED_COLOR } : undefined
      }
    >
      {label}
    </span>
  );
}
