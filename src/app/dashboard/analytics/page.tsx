import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAnalytics } from "@/lib/roles.shared";
import {
  getAnalyticsWeekSnapshot,
  getAverageAppSeconds,
  getCategorySalesShares,
  getDailySales,
  getProductProfitRanks,
  getSalesSummary,
} from "@/lib/analytics.server";
import { averageCheckCents, pickProfitLeaders } from "@/lib/analytics.shared";
import { formatAppDuration } from "@/lib/session-time.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { AccessDenied } from "@/components/access-denied";
import { AnalyticsKpiCards } from "@/components/analytics-kpi-cards";
import { AnalyticsWeekCards } from "@/components/analytics-week-cards";
import { CategorySalesChart } from "@/components/category-sales-chart";
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

  const [profitRanks, dailySales, categoryShares, weekSnapshot, sales, avgSeconds] =
    await Promise.all([
      getProductProfitRanks(),
      getDailySales(ANALYTICS_DAYS),
      getCategorySalesShares(),
      getAnalyticsWeekSnapshot(),
      getSalesSummary(),
      getAverageAppSeconds(),
    ]);
  const { top: topProducts, bottom: bottomProducts } = pickProfitLeaders(
    profitRanks,
    PROFIT_LIST_LIMIT,
  );

  return (
    <div className="flex flex-col gap-10">
      <AnalyticsKpiCards
        cards={[
          {
            key: "check",
            label: "Средний чек",
            value: formatPriceSomLabel(
              averageCheckCents(
                sales.confirmedRevenueCents,
                sales.confirmedOrderCount,
              ),
            ),
          },
          {
            key: "time",
            label: "Среднее время в приложении",
            value: formatAppDuration(avgSeconds),
          },
        ]}
      />

      <section className="grid items-stretch gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex h-full min-w-0 flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            По категориям
          </h2>
          <div className="min-h-0 flex-1">
            <CategorySalesChart shares={categoryShares} />
          </div>
        </div>
        <div className="flex h-full min-w-0 flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            По дням
          </h2>
          <div className="min-h-0 flex-1">
            <SalesChart days={dailySales} />
          </div>
        </div>
      </section>

      <AnalyticsWeekCards snapshot={weekSnapshot} />

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
