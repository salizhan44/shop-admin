import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAnalytics } from "@/lib/roles.shared";
import {
  getDailySales,
  getProductProfitRanks,
  getSalesSummary,
} from "@/lib/analytics.server";
import { pickProfitLeaders } from "@/lib/analytics.shared";
import { listWarehouseProducts } from "@/lib/products.server";
import {
  formatPriceSomLabel,
  formatSignedSomLabel,
  toWarehouseSnapshot,
} from "@/lib/products.shared";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { WarehouseBoard } from "@/components/warehouse-board";
import { SalesChart } from "@/components/sales-chart";
import { ProductProfitList } from "@/components/product-profit-list";

const ANALYTICS_DAYS = 45;
const PROFIT_LIST_LIMIT = 5;

export default async function AnalyticsPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessAnalytics(session.role)) {
    return (
      <AccessDenied
        title="Аналитика"
        message="Раздел доступен только владельцу."
      />
    );
  }

  const [summary, profitRanks, dailySales, warehouseProducts] =
    await Promise.all([
      getSalesSummary(),
      getProductProfitRanks(),
      getDailySales(ANALYTICS_DAYS),
      listWarehouseProducts(),
    ]);
  const warehouse = toWarehouseSnapshot(warehouseProducts, LOW_STOCK_THRESHOLD);
  const { top: topProducts, bottom: bottomProducts } = pickProfitLeaders(
    profitRanks,
    PROFIT_LIST_LIMIT,
  );

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Аналитика" />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Склад
        </h2>
        <WarehouseBoard snapshot={warehouse} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Продажи
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Выручка
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {formatPriceSomLabel(summary.confirmedRevenueCents)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {summary.confirmedOrderCount} заказов
            </p>
          </li>
          <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Прибыль
            </p>
            <p className="mt-1 text-xl font-semibold text-teal-800">
              {formatSignedSomLabel(summary.confirmedProfitCents)}
            </p>
          </li>
          <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ожидают
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {summary.pendingOrderCount}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatPriceSomLabel(summary.pendingTotalCents)}
            </p>
          </li>
          <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Отклонены
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {summary.rejectedOrderCount}
            </p>
          </li>
        </ul>

        <div>
          <h3 className="mb-3 text-base font-medium text-zinc-900">
            По дням ({ANALYTICS_DAYS} дней)
          </h3>
          <SalesChart days={dailySales} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Топ по прибыли
          </h2>
          <ProductProfitList products={topProducts} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Антитоп
          </h2>
          <ProductProfitList products={bottomProducts} tone="down" />
        </div>
      </section>
    </div>
  );
}
