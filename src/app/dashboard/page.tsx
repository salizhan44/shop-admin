import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import {
  canAccessAccounting,
  canAccessSupport,
  canAccessWarehouse,
} from "@/lib/roles.shared";
import { getMonthlySales } from "@/lib/analytics.server";
import { listOverviewForStaff } from "@/lib/orders.server";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { OVERVIEW_MONTHS } from "@/lib/overview.shared";
import { PageHeader } from "@/components/page-header";
import { OverviewMonthChart } from "@/components/overview-month-chart";
import { OverviewStatusCards } from "@/components/overview-status-cards";
import { OverviewActivity } from "@/components/overview-activity";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }

  const showChart = canAccessAccounting(session.role);
  const showOrders = canAccessWarehouse(session.role);
  const showSupportFallback =
    canAccessSupport(session.role) && !showChart && !showOrders;

  const [months, overview, tickets] = await Promise.all([
    showChart ? getMonthlySales(OVERVIEW_MONTHS) : Promise.resolve([]),
    showOrders ? listOverviewForStaff() : Promise.resolve(null),
    showSupportFallback
      ? listSupportTicketsForStaff()
      : Promise.resolve([]),
  ]);

  const counts = overview?.counts ?? { pending: 0, confirmed: 0, rejected: 0 };
  const activity = overview?.activity ?? [];
  const openTickets = tickets.filter((ticket) => ticket.status === "OPEN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Обзор" />
      {showChart ? <OverviewMonthChart months={months} /> : null}
      {showOrders ? (
        <>
          <OverviewStatusCards counts={counts} />
          <OverviewActivity orders={activity} />
        </>
      ) : null}
      {showSupportFallback ? (
        <Link
          href="/dashboard/support"
          className={`${UI_CARD_CLASS} block px-5 py-4 transition hover:bg-zinc-50`}
        >
          <p className="text-sm text-zinc-500">Обращения</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {openTickets.length}
          </p>
        </Link>
      ) : null}
    </div>
  );
}
