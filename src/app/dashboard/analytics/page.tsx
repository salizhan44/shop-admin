import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessAnalytics } from "@/lib/roles.shared";
import {
  getDailySales,
  getSalesSummary,
  getTopProducts,
} from "@/lib/analytics.server";
import { formatReportDay } from "@/lib/analytics.shared";
import { formatPriceRubles } from "@/lib/products.shared";

export default async function AnalyticsPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessAnalytics(session.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <p className="text-sm text-zinc-700">
          Раздел доступен только владельцу.
        </p>
      </main>
    );
  }

  const [summary, topProducts, dailySales] = await Promise.all([
    getSalesSummary(),
    getTopProducts(10),
    getDailySales(30),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <p className="text-sm text-zinc-600">
          Продажи по подтверждённым заказам. Ожидающие и отклонённые — отдельно.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Сводка</h2>
        <ul className="flex flex-col gap-2">
          <li className="rounded border border-zinc-200 bg-white px-3 py-2">
            <p className="text-sm text-zinc-600">Подтверждённые продажи</p>
            <p className="font-medium">
              {formatPriceRubles(summary.confirmedRevenueCents)} ₽ ·{" "}
              {summary.confirmedOrderCount} заказов
            </p>
          </li>
          <li className="rounded border border-zinc-200 bg-white px-3 py-2">
            <p className="text-sm text-zinc-600">Ожидают подтверждения</p>
            <p className="font-medium">
              {formatPriceRubles(summary.pendingTotalCents)} ₽ ·{" "}
              {summary.pendingOrderCount} заказов
            </p>
          </li>
          <li className="rounded border border-zinc-200 bg-white px-3 py-2">
            <p className="text-sm text-zinc-600">Отклонённые</p>
            <p className="font-medium">{summary.rejectedOrderCount} заказов</p>
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
                className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-zinc-600">
                    {product.quantitySold} шт.
                  </p>
                </div>
                <span className="text-sm text-zinc-700">
                  {formatPriceRubles(product.revenueCents)} ₽
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
                className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <span className="font-medium">{formatReportDay(day.date)}</span>
                <span className="text-sm text-zinc-700">
                  {formatPriceRubles(day.revenueCents)} ₽ · {day.orderCount}{" "}
                  зак.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
