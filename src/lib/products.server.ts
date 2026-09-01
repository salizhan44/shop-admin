import { prisma } from "./prisma.server";
import type { ProductPublic } from "./auth.shared";
import type { ProductAdmin, ProductWarehousePublic } from "./products.shared";

export async function listActiveProducts(): Promise<ProductPublic[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
    },
  });
}

export async function listCatalogProducts(): Promise<ProductAdmin[]> {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      isActive: true,
      stockQuantity: true,
    },
  });
}

export async function listWarehouseProducts(): Promise<ProductWarehousePublic[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
    },
  });
}

export async function createCatalogProduct(input: {
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
}): Promise<ProductPublic> {
  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      stockQuantity: input.stockQuantity,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
    },
  });
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

  return prisma.product.update({
    where: { id: productId },
    data: { stockQuantity },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      isActive: true,
      stockQuantity: true,
    },
  });
}

export function isProductError(
  value: ProductAdmin | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
