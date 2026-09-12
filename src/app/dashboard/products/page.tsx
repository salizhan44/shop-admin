import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageCatalog } from "@/lib/roles.shared";
import { listCatalogProducts, listCategoriesForCatalog } from "@/lib/products.server";
import { AccessDenied } from "@/components/access-denied";
import { CatalogProductList } from "./catalog-product-list";

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
    <div className="flex flex-col gap-6">
      <CatalogProductList products={products} categories={categories} />
    </div>
  );
}
