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
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";

export default async function AccountingPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessAccounting(session.role)) {
    return (
      <AccessDenied
        title="Учёт"
        message="Раздел доступен владельцу и бухгалтеру."
      />
    );
  }

  const orders = await listAccountingOrders();
  const confirmedRevenue = sumConfirmedRevenue(orders);
  const pendingTotal = sumPendingTotal(orders);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Учёт"
        description="Список заказов для бухгалтерии. В выручку входят только подтверждённые заказы."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Итоги</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">Подтверждённая выручка</p>
            <p className="mt-1 font-medium">
              {formatPriceSomLabel(confirmedRevenue)}
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">Ожидают подтверждения</p>
            <p className="mt-1 font-medium">
              {formatPriceSomLabel(pendingTotal)}
            </p>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Заказы ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-600">Заказов пока нет.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Дата</th>
                    <th className="px-4 py-3 font-medium">Клиент</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                          {orderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                        {formatPriceSomLabel(order.totalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-2 md:hidden">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
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
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">№ {order.id}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
