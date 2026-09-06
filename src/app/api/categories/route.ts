import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { listCategoriesForCatalog } from "@/lib/products.server";
import type { CategoryOptionPublic } from "@/lib/products.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const categories = await listCategoriesForCatalog();
  return jsonWithCors({
    categories,
  } satisfies { categories: CategoryOptionPublic[] });
}
