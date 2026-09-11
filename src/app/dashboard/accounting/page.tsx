import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAccounting } from "@/lib/roles.shared";
import { listAccountingOrders } from "@/lib/accounting.server";
import {
  sumConfirmedRevenue,
  sumPendingTotal,
} from "@/lib/accounting.shared";
import {
  formatOrderDate,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/orders.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { StatusBadge } from "@/components/status-badge";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";

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
      <PageHeader title="Учёт" />

      <ul className="grid gap-3 sm:grid-cols-2">
        <li className={`${UI_CARD_CLASS} px-5 py-4`}>
          <p className="text-sm text-zinc-500">Выручка</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {formatPriceSomLabel(confirmedRevenue)}
          </p>
        </li>
        <li className={`${UI_CARD_CLASS} px-5 py-4`}>
          <p className="text-sm text-zinc-500">Ожидают</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {formatPriceSomLabel(pendingTotal)}
          </p>
        </li>
      </ul>

      {orders.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет заказов</p>
      ) : (
        <>
          <div className={`hidden overflow-x-auto ${UI_CARD_CLASS} md:block`}>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Дата</th>
                  <th className="px-5 py-3">Клиент</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-600">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-900">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={orderStatusLabel(order.status)}
                        tone={orderStatusTone(order.status)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-zinc-900">
                      {formatPriceSomLabel(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {orders.map((order) => (
              <li key={order.id} className={`${UI_CARD_CLASS} px-5 py-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">
                      {formatPriceSomLabel(order.totalCents)}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-600">
                      {order.customerName}
                    </p>
                    <p className={UI_MUTED_CLASS}>
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    label={orderStatusLabel(order.status)}
                    tone={orderStatusTone(order.status)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
