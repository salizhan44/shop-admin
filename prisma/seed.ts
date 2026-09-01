import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  return randomInt(3, 8);
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
  const catalogNames = new Set(catalogProducts.map((item) => item.name));

  await prisma.product.updateMany({
    where: { name: { notIn: [...catalogNames] } },
    data: { isActive: false },
  });

  for (const item of catalogProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          priceCents: item.priceCents,
          stockQuantity: item.stockQuantity,
          isActive: true,
        },
      });
      continue;
    }

    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        stockQuantity: item.stockQuantity,
        isActive: true,
      },
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

  await seedProducts();
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
