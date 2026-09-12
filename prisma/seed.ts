import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { groceryCostCents, ensureGroceryProducts } from "./seed-grocery";
import { ensureDemoOrders, ensureDemoYearOrders } from "./seed-demo-orders";

const prisma = new PrismaClient();

const CATALOG_CATEGORIES = ["один", "два", "три", "четыре"] as const;
const PRODUCTS_PER_CATEGORY = 5;

const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
] as const;

type CatalogProductSeed = {
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLoremDescription(): string {
  const wordCount = randomInt(6, 36);
  const words: string[] = [];
  for (let index = 0; index < wordCount; index += 1) {
    words.push(LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)]!);
  }
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

function randomPriceCents(): number {
  return randomInt(2500, 89900);
}

function randomStockQuantity(): number {
  return randomInt(20, 80);
}

function buildCatalogProductName(productNumber: number, category: string): string {
  return `Товар${productNumber} ${category}`;
}

function generateCatalogProducts(): CatalogProductSeed[] {
  const products: CatalogProductSeed[] = [];

  for (const category of CATALOG_CATEGORIES) {
    for (let productNumber = 1; productNumber <= PRODUCTS_PER_CATEGORY; productNumber += 1) {
      products.push({
        name: buildCatalogProductName(productNumber, category),
        description: randomLoremDescription(),
        priceCents: randomPriceCents(),
        stockQuantity: randomStockQuantity(),
      });
    }
  }

  return products;
}

async function seedProducts() {
  const catalogProducts = generateCatalogProducts();

  for (const item of catalogProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          ...(existing.costCents === 0
            ? { costCents: groceryCostCents(existing.priceCents, existing.name) }
            : {}),
        },
      });
      continue;
    }

    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        costCents: groceryCostCents(item.priceCents, item.name),
        stockQuantity: item.stockQuantity,
        isActive: true,
      },
    });
  }
}

async function ensureQuickCategories() {
  const existing = await prisma.category.findMany();
  for (const name of ["МУКА", "МАКАРОНЫ", "ЛАПША"] as const) {
    const found = existing.find(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (found) {
      if (found.name !== name) {
        await prisma.category.update({
          where: { id: found.id },
          data: { name },
        });
      }
      continue;
    }
    await prisma.category.create({ data: { name } });
  }
}

async function backfillOrderItemCosts() {
  const items = await prisma.orderItem.findMany({
    where: { unitCostCents: 0 },
    select: { id: true, product: { select: { costCents: true } } },
  });
  for (const item of items) {
    if (item.product.costCents <= 0) {
      continue;
    }
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { unitCostCents: item.product.costCents },
    });
  }
}

async function ensureMissingCosts() {
  const rows = await prisma.product.findMany({
    where: { costCents: 0 },
    select: { id: true, name: true, priceCents: true },
  });
  for (const row of rows) {
    await prisma.product.update({
      where: { id: row.id },
      data: { costCents: groceryCostCents(row.priceCents, row.name) },
    });
  }
}

async function main() {
  const email = process.env.STAFF_SEED_EMAIL ?? "owner@local.test";
  const password = process.env.STAFF_SEED_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.staffUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Владелец",
      role: StaffRole.OWNER,
    },
  });
  await ensureDemoStaff(passwordHash);

  await seedProducts();
  await ensureQuickCategories();
  await ensureGroceryProducts(prisma);
  await ensureMissingCosts();
  await backfillOrderItemCosts();
  await ensurePromoCodes();
  await ensureDemoOrders(prisma);
  await ensureDemoYearOrders(prisma);
}

async function ensureDemoStaff(passwordHash: string) {
  const demoStaff = [
    {
      email: "alina.sklad@local.test",
      name: "Алина Козлова",
      role: StaffRole.WAREHOUSE,
    },
    {
      email: "boris.buh@local.test",
      name: "Борис Новиков",
      role: StaffRole.ACCOUNTANT,
    },
    {
      email: "vera.support@local.test",
      name: "Вера Смирнова",
      role: StaffRole.SUPPORT,
    },
    {
      email: "dmitry.sklad@local.test",
      name: "Дмитрий Орлов",
      role: StaffRole.WAREHOUSE,
    },
  ] as const;

  for (const member of demoStaff) {
    await prisma.staffUser.upsert({
      where: { email: member.email },
      update: {},
      create: {
        email: member.email,
        passwordHash,
        name: member.name,
        role: member.role,
      },
    });
  }
}

async function ensurePromoCodes() {
  await prisma.promoCode.upsert({
    where: { code: "ROLA10" },
    update: {},
    create: {
      code: "ROLA10",
      kind: "PERCENT",
      percentOff: 10,
      maxPerCustomer: 1,
    },
  });
  await prisma.promoCode.upsert({
    where: { code: "FIRST100" },
    update: {},
    create: {
      code: "FIRST100",
      kind: "AMOUNT",
      amountOffCents: 20000,
      maxTotalRedemptions: 100,
      maxPerCustomer: 1,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
