import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import {
  canAccessAccounting,
  canAccessSupport,
  canAccessWarehouse,
  canManageCatalog,
  staffRoleLabel,
} from "@/lib/roles.shared";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import { listOrdersForStaff } from "@/lib/orders.server";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { listWarehouseProducts } from "@/lib/products.server";
import { listAccountingOrders } from "@/lib/accounting.server";
import { sumConfirmedRevenue } from "@/lib/accounting.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";

function SummaryCard(props: {
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={props.href}
      className="block rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      <p className="text-sm text-zinc-600">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{props.value}</p>
      {props.hint ? (
        <p className="mt-1 text-xs text-zinc-500">{props.hint}</p>
      ) : null}
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }

  const showWarehouse = canAccessWarehouse(session.role);
  const showSupport = canAccessSupport(session.role);
  const showAccounting = canAccessAccounting(session.role);
  const showCatalog = canManageCatalog(session.role);

  const [orders, tickets, products, accountingOrders] = await Promise.all([
    showWarehouse ? listOrdersForStaff() : Promise.resolve([]),
    showSupport ? listSupportTicketsForStaff() : Promise.resolve([]),
    showWarehouse || showCatalog
      ? listWarehouseProducts()
      : Promise.resolve([]),
    showAccounting ? listAccountingOrders() : Promise.resolve([]),
  ]);

  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const openTickets = tickets.filter((ticket) => ticket.status === "OPEN");
  const lowStock = products.filter(
    (product) => product.stockQuantity <= LOW_STOCK_THRESHOLD,
  );
  const confirmedRevenue = sumConfirmedRevenue(accountingOrders);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Обзор"
        description={`${session.name} · ${staffRoleLabel(session.role)}. Кратко о том, что требует внимания.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {showWarehouse ? (
          <SummaryCard
            label="Ожидают подтверждения"
            value={String(pendingOrders.length)}
            hint="Заказы из приложения"
            href="/dashboard/orders"
          />
        ) : null}
        {showSupport ? (
          <SummaryCard
            label="Открытые обращения"
            value={String(openTickets.length)}
            hint="Поддержка клиентов"
            href="/dashboard/support"
          />
        ) : null}
        {showWarehouse || showCatalog ? (
          <SummaryCard
            label="Мало на складе"
            value={String(lowStock.length)}
            hint={`Остаток ≤ ${LOW_STOCK_THRESHOLD} шт.`}
            href={showCatalog ? "/dashboard/products" : "/dashboard/stock"}
          />
        ) : null}
        {showAccounting ? (
          <SummaryCard
            label="Подтверждённая выручка"
            value={formatPriceSomLabel(confirmedRevenue)}
            hint="Только подтверждённые заказы"
            href="/dashboard/accounting"
          />
        ) : null}
      </section>

      {!showWarehouse && !showSupport && !showAccounting && !showCatalog ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
          Для вашей роли пока нет сводных карточек. Выберите раздел в меню.
        </p>
      ) : null}
    </div>
  );
}
