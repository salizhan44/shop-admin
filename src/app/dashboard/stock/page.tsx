import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessWarehouse } from "@/lib/roles.shared";
import { listWarehouseProducts } from "@/lib/products.server";

export default async function StockPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessWarehouse(session.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Остатки</h1>
        <p className="text-sm text-zinc-700">
          У вашей роли нет доступа к складу.
        </p>
      </main>
    );
  }

  const products = await listWarehouseProducts();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Остатки на складе</h1>
        <p className="text-sm text-zinc-600">
          Только просмотр. Изменить остаток может владелец в ассортименте.
          При подтверждении заказа количество уменьшается автоматически.
        </p>
      </header>
      <section className="flex flex-col gap-3">
        {products.length === 0 ? (
          <p className="text-sm text-zinc-600">Активных товаров пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-zinc-700">
                  {product.stockQuantity} шт.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
