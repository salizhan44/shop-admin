import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NAMES = ["МУКА", "МАКАРОНЫ", "ЛАПША"] as const;

async function ensureCategory(name: string) {
  const existing = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
  const matches = existing.filter(
    (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
  );

  if (matches.length === 0) {
    const row = await prisma.category.create({ data: { name } });
    console.log(`created ${row.name} ${row.id}`);
    return;
  }

  const keep =
    matches.find((category) => category.name === name) ??
    matches.find((category) => category._count.products > 0) ??
    matches[0]!;

  for (const category of matches) {
    if (category.id === keep.id) {
      continue;
    }
    if (category._count.products > 0) {
      await prisma.product.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: keep.id },
      });
    }
    await prisma.category.delete({ where: { id: category.id } });
    console.log(`deleted duplicate ${category.name} ${category.id}`);
  }

  if (keep.name !== name) {
    await prisma.category.update({
      where: { id: keep.id },
      data: { name },
    });
    console.log(`renamed ${keep.name} -> ${name}`);
  } else {
    console.log(`exists ${keep.name} ${keep.id}`);
  }
}

async function main() {
  for (const name of NAMES) {
    await ensureCategory(name);
  }
  const all = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  console.log("all:", all.map((c) => c.name).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
