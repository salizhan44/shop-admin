import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import { listCatalogProducts } from "@/lib/products.server";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { ProductForm } from "./product-form";
import { StockAdjust } from "./stock-adjust";

export default async function ProductsPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManageCatalog(session.role)) {
    return (
      <AccessDenied
        title="Ассортимент"
        message="У вашей роли нет доступа к управлению каталогом."
      />
    );
  }

  const products = await listCatalogProducts();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ассортимент"
        description="Товары сразу видны в приложении. Остаток списывается при подтверждении заказа."
      />
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
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-zinc-600">
                  {formatPriceSomLabel(product.priceCents)} · на складе{" "}
                  {product.stockQuantity} шт.
                </p>
                {product.description ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {product.description}
                  </p>
                ) : null}
                <StockAdjust
                  productId={product.id}
                  initialStock={product.stockQuantity}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
