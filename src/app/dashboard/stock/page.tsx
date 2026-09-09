import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import {
  canAccessAnalytics,
  canViewWarehouseStockPage,
} from "@/lib/roles.shared";
import { listWarehouseProducts } from "@/lib/products.server";
import { toWarehouseSnapshot } from "@/lib/products.shared";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { WarehouseBoard } from "@/components/warehouse-board";

export default async function StockPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (canAccessAnalytics(session.role)) {
    redirect("/dashboard/analytics");
  }
  if (!canViewWarehouseStockPage(session.role)) {
    return (
      <AccessDenied
        title="Склад"
        message="У вашей роли нет доступа к складу."
      />
    );
  }

  const products = await listWarehouseProducts();
  const snapshot = toWarehouseSnapshot(products, LOW_STOCK_THRESHOLD);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Склад"
        description="Просмотр остатков: название, цена и фото. Изменить количество может владелец в ассортименте. При подтверждении заказа остаток уменьшается."
      />
      <WarehouseBoard snapshot={snapshot} />
    </div>
  );
}
