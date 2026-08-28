import { prisma } from "./prisma.server";
import type { ProductPublic } from "./auth.shared";
import type { ProductAdmin } from "./products.shared";

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
    },
  });
}

export async function createCatalogProduct(input: {
  name: string;
  description: string;
  priceCents: number;
}): Promise<ProductPublic> {
  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
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
