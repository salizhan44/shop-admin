import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import {
  canAccessAccounting,
  canAccessAnalytics,
  canAccessSupport,
  canAccessWarehouse,
  canManageCatalog,
} from "@/lib/roles.shared";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import { listOrdersForStaff } from "@/lib/orders.server";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { listWarehouseProducts } from "@/lib/products.server";
import { listAccountingOrders } from "@/lib/accounting.server";
import { sumConfirmedRevenue } from "@/lib/accounting.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

function SummaryCard(props: {
  label: string;
  value: string;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link
      href={props.href}
      className={`${UI_CARD_CLASS} block px-5 py-4 transition hover:bg-zinc-50 ${
        props.attention ? "ring-amber-200/80" : ""
      }`}
    >
      <p className="text-sm text-zinc-500">{props.label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          props.attention ? "text-amber-800" : "text-zinc-900"
        }`}
      >
        {props.value}
      </p>
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
      <PageHeader title="Обзор" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {showWarehouse ? (
          <SummaryCard
            label="Ожидают"
            value={String(pendingOrders.length)}
            href="/dashboard/orders"
            attention={pendingOrders.length > 0}
          />
        ) : null}
        {showSupport ? (
          <SummaryCard
            label="Обращения"
            value={String(openTickets.length)}
            href="/dashboard/support"
            attention={openTickets.length > 0}
          />
        ) : null}
        {showWarehouse || showCatalog ? (
          <SummaryCard
            label="Мало на складе"
            value={String(lowStock.length)}
            href={
              canAccessAnalytics(session.role)
                ? "/dashboard/analytics"
                : showCatalog
                  ? "/dashboard/products"
                  : "/dashboard/stock"
            }
            attention={lowStock.length > 0}
          />
        ) : null}
        {showAccounting ? (
          <SummaryCard
            label="Выручка"
            value={formatPriceSomLabel(confirmedRevenue)}
            href="/dashboard/accounting"
          />
        ) : null}
      </section>
    </div>
  );
}
