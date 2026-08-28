import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import { listCatalogProducts } from "@/lib/products.server";
import { formatPriceRubles } from "@/lib/products.shared";
import { ProductForm } from "./product-form";

export default async function ProductsPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManageCatalog(session.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Ассортимент</h1>
        <p className="text-sm text-zinc-700">
          У вашей роли нет доступа к управлению каталогом.
        </p>
      </main>
    );
  }

  const products = await listCatalogProducts();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Ассортимент</h1>
        <p className="text-sm text-zinc-600">
          Товары сразу видны в приложении.
        </p>
      </header>
      <ProductForm />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Список</h2>
        {products.length === 0 ? (
          <p className="text-sm text-zinc-600">Пока нет ни одного товара.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-zinc-600">
                  {formatPriceRubles(product.priceCents)} ₽
                </p>
                {product.description ? (
                  <p className="mt-1 text-sm text-zinc-600">{product.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
