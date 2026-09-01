import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAccounting } from "@/lib/roles.shared";
import { listAccountingOrders } from "@/lib/accounting.server";
import {
  sumConfirmedRevenue,
  sumPendingTotal,
} from "@/lib/accounting.shared";
import { formatOrderDate, orderStatusLabel } from "@/lib/orders.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";

export default async function AccountingPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessAccounting(session.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Учёт</h1>
        <p className="text-sm text-zinc-700">
          Раздел доступен владельцу и бухгалтеру.
        </p>
      </main>
    );
  }

  const orders = await listAccountingOrders();
  const confirmedRevenue = sumConfirmedRevenue(orders);
  const pendingTotal = sumPendingTotal(orders);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Учёт</h1>
        <p className="text-sm text-zinc-600">
          Список заказов для бухгалтерии. В выручку входят только подтверждённые
          заказы.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Итоги</h2>
        <ul className="flex flex-col gap-2">
          <li className="rounded border border-zinc-200 bg-white px-3 py-2">
            <p className="text-sm text-zinc-600">Подтверждённая выручка</p>
            <p className="font-medium">
              {formatPriceSomLabel(confirmedRevenue)}
            </p>
          </li>
          <li className="rounded border border-zinc-200 bg-white px-3 py-2">
            <p className="text-sm text-zinc-600">Ожидают подтверждения</p>
            <p className="font-medium">{formatPriceSomLabel(pendingTotal)}</p>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Заказы ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-600">Заказов пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {formatPriceSomLabel(order.totalCents)}
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
                <p className="mt-1 text-xs text-zinc-500">№ {order.id}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
