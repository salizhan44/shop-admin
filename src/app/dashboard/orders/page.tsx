import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { listOrdersForStaff } from "@/lib/orders.server";
import { getLatestOrderUpdatedAt } from "@/lib/updates.server";
import {
  formatOrderDate,
  orderStatusLabel,
  orderStatusTone,
  type OrderStaffPublic,
} from "@/lib/orders.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { StatusBadge } from "@/components/status-badge";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { OrderActions } from "./order-actions";

function OrderCard(props: { order: OrderStaffPublic }) {
  const { order } = props;

  return (
    <li className={`${UI_CARD_CLASS} px-5 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">
            № {order.id.slice(-8).toUpperCase()}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {order.customerName}
            {order.phone ? ` · ${order.phone}` : ""}
          </p>
          {order.address ? (
            <p className="text-sm text-zinc-600">{order.address}</p>
          ) : null}
          {order.comment ? (
            <p className="text-sm text-zinc-500">{order.comment}</p>
          ) : null}
          <p className={`${UI_MUTED_CLASS} mt-1`}>
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge
          label={orderStatusLabel(order.status)}
          tone={orderStatusTone(order.status)}
        />
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm text-zinc-700">
        {order.items.map((item) => {
          const notEnough =
            order.status === "PENDING" &&
            item.stockQuantityOnHand < item.quantity;
          return (
            <li key={item.id} className={notEnough ? "text-red-700" : undefined}>
              {item.productName} · {item.quantity} ×{" "}
              {formatPriceSomLabel(item.priceCents)}
              {order.status === "PENDING" ? (
                <span className={notEnough ? "font-medium" : "text-zinc-500"}>
                  {" "}
                  · {item.stockQuantityOnHand} шт. на складе
                  {notEnough ? " — не хватает" : ""}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm font-semibold text-zinc-900">
        {formatPriceSomLabel(order.totalCents)}
      </p>
      {order.promoCode ? (
        <p className={UI_MUTED_CLASS}>
          {order.promoCode}
          {order.discountCents > 0
            ? ` · −${formatPriceSomLabel(order.discountCents)}`
            : ""}
        </p>
      ) : null}
      {order.rejectionReason ? (
        <p className="mt-2 text-sm text-red-700">{order.rejectionReason}</p>
      ) : null}
      {order.status === "PENDING" ? (
        <OrderActions orderId={order.id} />
      ) : null}
    </li>
  );
}

export default async function OrdersPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessWarehouse(session.role)) {
    return (
      <AccessDenied
        title="Заказы"
        message="У вашей роли нет доступа к заказам склада."
      />
    );
  }

  const orders = await listOrdersForStaff();
  const latestAt = await getLatestOrderUpdatedAt();
  const pending = orders.filter((order) => order.status === "PENDING");
  const processed = orders.filter((order) => order.status !== "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Заказы"
        actions={
          <RefreshWithUpdates
            pollUrl="/api/staff/orders/updates"
            initialLatestAt={latestAt}
          />
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Ожидают · {pending.length}
        </h2>
        {pending.length === 0 ? (
          <p className={UI_MUTED_CLASS}>Нет заказов</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Обработанные · {processed.length}
        </h2>
        {processed.length === 0 ? (
          <p className={UI_MUTED_CLASS}>Нет обработанных</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {processed.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
