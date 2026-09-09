import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import { listCatalogProducts, listCategoriesForCatalog } from "@/lib/products.server";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { ProductForm } from "./product-form";
import { ProductDeleteButton } from "./product-delete-button";
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

  const [products, categories] = await Promise.all([
    listCatalogProducts(),
    listCategoriesForCatalog(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ассортимент"
        description="Товары сразу видны в приложении. Остаток списывается при подтверждении заказа."
      />
      <ProductForm categories={categories} />
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
                <div className="flex gap-3">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200/80"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80">
                      ▦
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{product.name}</p>
                    {product.categoryName ? (
                      <p className="text-sm text-zinc-600">
                        {product.categoryName}
                        {product.subcategoryName
                          ? ` · ${product.subcategoryName}`
                          : ""}
                      </p>
                    ) : null}
                    <p className="text-sm text-zinc-600">
                      {formatPriceSomLabel(product.priceCents)} · себест.{" "}
                      {formatPriceSomLabel(product.costCents)} · на складе{" "}
                      {product.stockQuantity} шт.
                    </p>
                    {product.description ? (
                      <p className="mt-1 text-sm text-zinc-600">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <StockAdjust
                      productId={product.id}
                      initialStock={product.stockQuantity}
                    />
                    <ProductDeleteButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                  <ProductForm categories={categories} product={product} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
