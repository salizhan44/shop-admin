import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { listOrdersForStaff } from "@/lib/orders.server";
import { getLatestOrderUpdatedAt } from "@/lib/updates.server";
import {
  formatOrderDate,
  orderStatusLabel,
  type OrderStaffPublic,
} from "@/lib/orders.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { RefreshWithUpdates } from "@/components/refresh-with-updates";
import { OrderActions } from "./order-actions";

function OrderCard(props: { order: OrderStaffPublic }) {
  const { order } = props;

  return (
    <li className="rounded border border-zinc-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            Заказ {order.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-zinc-600">
            {order.customerName} · {order.customerEmail}
          </p>
          <p className="text-sm text-zinc-600">
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {orderStatusLabel(order.status)}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm text-zinc-700">
        {order.items.map((item) => {
          const notEnough =
            order.status === "PENDING" &&
            item.stockQuantityOnHand < item.quantity;
          return (
            <li key={item.id} className={notEnough ? "text-red-700" : undefined}>
              {item.productName} · {item.quantity} ×{" "}
              {formatPriceSomLabel(item.priceCents)} ={" "}
              {formatPriceSomLabel(item.lineTotalCents)}
              {order.status === "PENDING" ? (
                <span>
                  {" "}
                  · на складе {item.stockQuantityOnHand} шт.
                  {notEnough ? " (не хватает)" : ""}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm font-medium">
        Итого: {formatPriceSomLabel(order.totalCents)}
      </p>
      {order.rejectionReason ? (
        <p className="mt-2 text-sm text-red-700">
          Причина отклонения: {order.rejectionReason}
        </p>
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
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Заказы</h1>
        <p className="text-sm text-zinc-700">
          У вашей роли нет доступа к заказам склада.
        </p>
      </main>
    );
  }

  const orders = await listOrdersForStaff();
  const latestAt = await getLatestOrderUpdatedAt();
  const pending = orders.filter((order) => order.status === "PENDING");
  const processed = orders.filter((order) => order.status !== "PENDING");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Заказы</h1>
        <p className="text-sm text-zinc-600">
          Новые заявки из приложения. Подтверждение и отклонение — здесь.
        </p>
        <RefreshWithUpdates
          pollUrl="/api/staff/orders/updates"
          initialLatestAt={latestAt}
        />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          Ожидают ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-600">Новых заказов пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          Обработанные ({processed.length})
        </h2>
        {processed.length === 0 ? (
          <p className="text-sm text-zinc-600">История пока пустая.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {processed.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
