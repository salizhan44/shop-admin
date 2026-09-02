import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { listWarehouseProducts } from "@/lib/products.server";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";

export default async function StockPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessWarehouse(session.role)) {
    return (
      <AccessDenied
        title="Остатки"
        message="У вашей роли нет доступа к складу."
      />
    );
  }

  const products = await listWarehouseProducts();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Остатки на складе"
        description="Только просмотр. Изменить остаток может владелец в ассортименте. При подтверждении заказа количество уменьшается автоматически."
      />
      <section className="flex flex-col gap-3">
        {products.length === 0 ? (
          <p className="text-sm text-zinc-600">Активных товаров пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <span className="min-w-0 font-medium">{product.name}</span>
                <span className="shrink-0 text-sm text-zinc-700">
                  {product.stockQuantity} шт.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
