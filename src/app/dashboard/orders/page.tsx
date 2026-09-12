import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { listOrdersForStaff } from "@/lib/orders.server";
import { getLatestOrderUpdatedAt } from "@/lib/updates.server";
import { AccessDenied } from "@/components/access-denied";
import { StaffOrdersList } from "./staff-orders-list";

export default async function OrdersPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessWarehouse(session.role)) {
    return (
      <AccessDenied
        title="Заказы"
        message="У вашей роли нет доступа к заказам склада."
      />
    );
  }

  const orders = await listOrdersForStaff();
  const latestAt = await getLatestOrderUpdatedAt();

  return <StaffOrdersList orders={orders} latestAt={latestAt} />;
}
