import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PRODUCTS = [
  {
    name: "Хлеб белый",
    description: "Нарезной батон, 400 г",
    priceCents: 4500,
    stockQuantity: 40,
  },
  {
    name: "Молоко 1 л",
    description: "Пастеризованное 2,5%",
    priceCents: 8900,
    stockQuantity: 30,
  },
  {
    name: "Яйца С0, 10 шт",
    description: "Куриные яйца категории С0",
    priceCents: 11900,
    stockQuantity: 25,
  },
  {
    name: "Сыр Российский",
    description: "Твёрдый сыр, 200 г",
    priceCents: 24900,
    stockQuantity: 18,
  },
  {
    name: "Курица охлаждённая",
    description: "Тушка, ~1,5 кг",
    priceCents: 38900,
    stockQuantity: 12,
  },
  {
    name: "Рис 1 кг",
    description: "Длиннозёрный, шлифованный",
    priceCents: 9900,
    stockQuantity: 35,
  },
  {
    name: "Макароны 500 г",
    description: "Горошек, группа А",
    priceCents: 6900,
    stockQuantity: 50,
  },
  {
    name: "Масло подсолнечное 1 л",
    description: "Рафинированное, дезодорированное",
    priceCents: 14900,
    stockQuantity: 22,
  },
  {
    name: "Сахар 1 кг",
    description: "Белый кристаллический",
    priceCents: 7900,
    stockQuantity: 28,
  },
  {
    name: "Картофель 1 кг",
    description: "Молодой, для варки",
    priceCents: 5900,
    stockQuantity: 60,
  },
  {
    name: "Яблоки 1 кг",
    description: "Сезонные, красные",
    priceCents: 12900,
    stockQuantity: 20,
  },
  {
    name: "Бананы 1 кг",
    description: "Свежие, Эквадор",
    priceCents: 10900,
    stockQuantity: 24,
  },
  {
    name: "Вода 1,5 л",
    description: "Негазированная питьевая",
    priceCents: 4900,
    stockQuantity: 45,
  },
  {
    name: "Кофе молотый 250 г",
    description: "Средняя обжарка, Arabica",
    priceCents: 34900,
    stockQuantity: 15,
  },
  {
    name: "Чай чёрный 100 пак",
    description: "Классический байховый",
    priceCents: 18900,
    stockQuantity: 20,
  },
  {
    name: "Печенье «Юбилейное»",
    description: "Сахарное, 112 г",
    priceCents: 7900,
    stockQuantity: 32,
  },
  {
    name: "Йогурт натуральный",
    description: "Без добавок, 390 г",
    priceCents: 6900,
    stockQuantity: 26,
  },
  {
    name: "Колбаса докторская",
    description: "Варёная, 500 г",
    priceCents: 32900,
    stockQuantity: 14,
  },
  {
    name: "Помидоры 1 кг",
    description: "Свежие, для салата",
    priceCents: 19900,
    stockQuantity: 16,
  },
  {
    name: "Огурцы 1 кг",
    description: "Свежие, тепличные",
    priceCents: 14900,
    stockQuantity: 18,
  },
  {
    name: "Мука 2 кг",
    description: "Пшеничная высший сорт",
    priceCents: 11900,
    stockQuantity: 30,
  },
  {
    name: "Сметана 20%",
    description: "Стакан 300 г",
    priceCents: 8900,
    stockQuantity: 22,
  },
  {
    name: "Сок яблочный 1 л",
    description: "100% без добавления сахара",
    priceCents: 12900,
    stockQuantity: 20,
  },
  {
    name: "Шоколад молочный",
    description: "Плитка 90 г",
    priceCents: 9900,
    stockQuantity: 40,
  },
] as const;

async function seedProducts() {
  for (const item of SEED_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });
    if (existing) {
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
