import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAnalytics } from "@/lib/roles.shared";
import {
  getDailySales,
  getSalesSummary,
  getTopProducts,
} from "@/lib/analytics.server";
import { formatReportDay } from "@/lib/analytics.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";

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

  const [summary, topProducts, dailySales] = await Promise.all([
    getSalesSummary(),
    getTopProducts(10),
    getDailySales(30),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Аналитика"
        description="Продажи по подтверждённым заказам. Ожидающие и отклонённые — отдельно."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Сводка</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">Подтверждённые продажи</p>
            <p className="mt-1 font-medium">
              {formatPriceSomLabel(summary.confirmedRevenueCents)} ·{" "}
              {summary.confirmedOrderCount} заказов
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">Ожидают подтверждения</p>
            <p className="mt-1 font-medium">
              {formatPriceSomLabel(summary.pendingTotalCents)} ·{" "}
              {summary.pendingOrderCount} заказов
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">Отклонённые</p>
            <p className="mt-1 font-medium">
              {summary.rejectedOrderCount} заказов
            </p>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Топ товаров</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Подтверждённых продаж пока нет.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topProducts.map((product) => (
              <li
                key={product.productId}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-zinc-600">
                    {product.quantitySold} шт.
                  </p>
                </div>
                <span className="shrink-0 text-sm text-zinc-700">
                  {formatPriceSomLabel(product.revenueCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Продажи по дням (30 дней)</h2>
        {dailySales.length === 0 ? (
          <p className="text-sm text-zinc-600">
            За последние 30 дней подтверждённых заказов нет.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dailySales.map((day) => (
              <li
                key={day.date}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <span className="font-medium">{formatReportDay(day.date)}</span>
                <span className="text-sm text-zinc-700">
                  {formatPriceSomLabel(day.revenueCents)} · {day.orderCount}{" "}
                  зак.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
