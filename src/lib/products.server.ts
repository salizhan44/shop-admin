import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma.server";
import type { ProductPublic } from "./auth.shared";
import type {
  CategoryOptionPublic,
  ProductAdmin,
  ProductWarehousePublic,
} from "./products.shared";
import { validateProductImageUrl } from "./products.shared";

const PRODUCT_IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products",
);

const productAdminSelect = {
  id: true,
  name: true,
  description: true,
  priceCents: true,
  costCents: true,
  isActive: true,
  stockQuantity: true,
  imageUrl: true,
  categoryId: true,
  subcategoryId: true,
  category: { select: { name: true } },
  subcategory: { select: { name: true } },
} as const;

const productPublicSelect = {
  id: true,
  name: true,
  description: true,
  priceCents: true,
  imageUrl: true,
  categoryId: true,
  subcategoryId: true,
} as const;

function toProductAdmin(row: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  costCents: number;
  isActive: boolean;
  stockQuantity: number;
  imageUrl: string;
  categoryId: string | null;
  subcategoryId: string | null;
  category: { name: string } | null;
  subcategory: { name: string } | null;
}): ProductAdmin {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    costCents: row.costCents,
    isActive: row.isActive,
    stockQuantity: row.stockQuantity,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategory?.name ?? null,
  };
}

function parseDataImage(
  dataUrl: string,
): { ext: "jpg" | "png" | "webp"; buffer: Buffer } | null {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl);
  if (!match || !match[1] || !match[2]) {
    return null;
  }
  const kind = match[1].toLowerCase();
  const ext = kind === "png" ? "png" : kind === "webp" ? "webp" : "jpg";
  try {
    return { ext, buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

async function clearStoredProductImage(productId: string): Promise<void> {
  for (const ext of ["jpg", "png", "webp"] as const) {
    const filePath = path.join(PRODUCT_IMAGE_DIR, `${productId}.${ext}`);
    try {
      await unlink(filePath);
    } catch {
      // файла могло не быть
    }
  }
}

async function persistProductImageDataUrl(
  productId: string,
  dataUrl: string,
): Promise<string | { error: string }> {
  const parsed = parseDataImage(dataUrl);
  if (!parsed) {
    return { error: "Нужна картинка JPEG/PNG/WebP" };
  }
  if (parsed.buffer.length > 900_000) {
    return { error: "Файл фото слишком большой — выберите изображение поменьше" };
  }
  await mkdir(PRODUCT_IMAGE_DIR, { recursive: true });
  await clearStoredProductImage(productId);
  const fileName = `${productId}.${parsed.ext}`;
  await writeFile(path.join(PRODUCT_IMAGE_DIR, fileName), parsed.buffer);
  return `/uploads/products/${fileName}?v=${Date.now()}`;
}

async function resolveProductImageUrl(
  productId: string,
  imageUrl: string | undefined,
  previousUrl: string,
): Promise<string | { error: string }> {
  if (imageUrl === undefined) {
    return previousUrl;
  }
  const trimmed = imageUrl.trim();
  const validationError = validateProductImageUrl(trimmed);
  if (validationError) {
    return { error: validationError };
  }
  if (trimmed.length === 0) {
    await clearStoredProductImage(productId);
    return "";
  }
  if (trimmed.startsWith("data:image/")) {
    return persistProductImageDataUrl(productId, trimmed);
  }
  if (trimmed.startsWith("/uploads/products/")) {
    return trimmed;
  }
  return { error: "Нужна картинка JPEG/PNG/WebP" };
}

export async function listActiveProducts(): Promise<ProductPublic[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: productPublicSelect,
  });
}

export async function listCatalogProducts(): Promise<ProductAdmin[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: productAdminSelect,
  });
  return rows.map(toProductAdmin);
}

export async function listCategoriesForCatalog(): Promise<
  CategoryOptionPublic[]
> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subcategories: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });
  return rows;
}

export async function listWarehouseProducts(): Promise<ProductWarehousePublic[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      stockQuantity: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.priceCents,
    stockQuantity: row.stockQuantity,
    imageUrl: row.imageUrl,
    categoryName: row.category?.name ?? null,
  }));
}

async function resolveCategoryLinks(input: {
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
}): Promise<
  | { categoryId: string | null; subcategoryId: string | null }
  | { error: string }
> {
  let categoryId = input.categoryId?.trim() || null;
  const categoryName = input.categoryName?.trim() ?? "";
  let subcategoryId = input.subcategoryId?.trim() || null;
  const subcategoryName = input.subcategoryName?.trim() ?? "";

  if (!categoryId && categoryName.length > 0) {
    const existing = await prisma.category.findUnique({
      where: { name: categoryName },
      select: { id: true },
    });
    if (existing) {
      categoryId = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: categoryName },
        select: { id: true },
      });
      categoryId = created.id;
    }
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      return { error: "Категория не найдена" };
    }
  }

  const wantsSubcategory = Boolean(subcategoryId) || subcategoryName.length > 0;
  if (wantsSubcategory && !categoryId) {
    return { error: "Для подкатегории сначала укажите категорию" };
  }

  if (subcategoryId && categoryId) {
    const subcategory = await prisma.subcategory.findFirst({
      where: { id: subcategoryId, categoryId },
      select: { id: true },
    });
    if (!subcategory) {
      return { error: "Подкатегория не относится к выбранной категории" };
    }
  }

  if (!subcategoryId && subcategoryName.length > 0 && categoryId) {
    const existing = await prisma.subcategory.findUnique({
      where: {
        categoryId_name: { categoryId, name: subcategoryName },
      },
      select: { id: true },
    });
    if (existing) {
      subcategoryId = existing.id;
    } else {
      const created = await prisma.subcategory.create({
        data: { name: subcategoryName, categoryId },
        select: { id: true },
      });
      subcategoryId = created.id;
    }
  }

  return { categoryId, subcategoryId };
}

export async function createCatalogProduct(input: {
  name: string;
  description: string;
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  imageUrl?: string;
}): Promise<ProductPublic | { error: string }> {
  const links = await resolveCategoryLinks(input);
  if ("error" in links) {
    return links;
  }

  const created = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      costCents: input.costCents,
      stockQuantity: input.stockQuantity,
      isActive: true,
      imageUrl: "",
      categoryId: links.categoryId,
      subcategoryId: links.subcategoryId,
    },
    select: productPublicSelect,
  });

  if (!input.imageUrl || input.imageUrl.trim().length === 0) {
    return created;
  }

  const imageUrl = await resolveProductImageUrl(
    created.id,
    input.imageUrl,
    "",
  );
  if (typeof imageUrl !== "string") {
    await prisma.product.delete({ where: { id: created.id } });
    return imageUrl;
  }

  return prisma.product.update({
    where: { id: created.id },
    data: { imageUrl },
    select: productPublicSelect,
  });
}

export async function updateCatalogProduct(
  productId: string,
  input: {
    name: string;
    description: string;
    priceCents: number;
    costCents: number;
    stockQuantity: number;
    categoryId?: string;
    categoryName?: string;
    subcategoryId?: string;
    subcategoryName?: string;
    imageUrl?: string;
  },
): Promise<ProductAdmin | { error: string; status: number }> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true, imageUrl: true },
  });
  if (!existing || !existing.isActive) {
    return { error: "Товар не найден", status: 404 };
  }

  const links = await resolveCategoryLinks(input);
  if ("error" in links) {
    return { error: links.error, status: 400 };
  }

  const imageUrl = await resolveProductImageUrl(
    productId,
    input.imageUrl,
    existing.imageUrl,
  );
  if (typeof imageUrl !== "string") {
    return { error: imageUrl.error, status: 400 };
  }

  const row = await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      costCents: input.costCents,
      stockQuantity: input.stockQuantity,
      categoryId: links.categoryId,
      subcategoryId: links.subcategoryId,
      imageUrl,
    },
    select: productAdminSelect,
  });
  return toProductAdmin(row);
}

export async function updateProductStock(
  productId: string,
  stockQuantity: number,
): Promise<ProductAdmin | { error: string; status: number }> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Товар не найден", status: 404 };
  }

  const row = await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity },
    select: productAdminSelect,
  });
  return toProductAdmin(row);
}

/** Скрывает товар из каталога (мягкое удаление). Позиции в заказах сохраняются. */
export async function deactivateCatalogProduct(
  productId: string,
): Promise<ProductAdmin | { error: string; status: number }> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    return { error: "Товар не найден", status: 404 };
  }
  if (!existing.isActive) {
    return { error: "Товар уже удалён из ассортимента", status: 400 };
  }

  const [, row] = await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId } }),
    prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
      select: productAdminSelect,
    }),
  ]);

  return toProductAdmin(row);
}

export function isProductError(
  value: ProductAdmin | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}

export function isCreateProductError(
  value: ProductPublic | { error: string },
): value is { error: string } {
  return "error" in value;
}
