import type { PrismaClient } from "@prisma/client";

type GrocerySeed = {
  category: "МУКА" | "МАКАРОНЫ" | "ЛАПША";
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
};

export const GROCERY_PRODUCTS: GrocerySeed[] = [
  {
    category: "МУКА",
    name: "Мука пшеничная в/с 2 кг",
    description: "Пшеничная мука высшего сорта для выпечки.",
    priceCents: 18900,
    stockQuantity: 140,
  },
  {
    category: "МУКА",
    name: "Мука пшеничная в/с 5 кг",
    description: "Большая пачка высшего сорта.",
    priceCents: 42900,
    stockQuantity: 90,
  },
  {
    category: "МУКА",
    name: "Мука пшеничная 1с 2 кг",
    description: "Первый сорт, повседневная выпечка.",
    priceCents: 15900,
    stockQuantity: 120,
  },
  {
    category: "МУКА",
    name: "Мука ржаная 1 кг",
    description: "Для бородинского и ржаного хлеба.",
    priceCents: 13500,
    stockQuantity: 70,
  },
  {
    category: "МУКА",
    name: "Мука кукурузная 1 кг",
    description: "Для лепёшек и панировки.",
    priceCents: 11200,
    stockQuantity: 55,
  },
  {
    category: "МУКА",
    name: "Мука блинная 1 кг",
    description: "Готовая смесь для блинов.",
    priceCents: 14800,
    stockQuantity: 60,
  },
  {
    category: "МУКА",
    name: "Манка 800 г",
    description: "Крупка для каши и запеканок.",
    priceCents: 7900,
    stockQuantity: 100,
  },
  {
    category: "МУКА",
    name: "Отруби пшеничные 400 г",
    description: "Добавка в выпечку и каши.",
    priceCents: 6400,
    stockQuantity: 45,
  },
  {
    category: "МАКАРОНЫ",
    name: "Спагетти 400 г",
    description: "Классические длинные макароны.",
    priceCents: 8900,
    stockQuantity: 160,
  },
  {
    category: "МАКАРОНЫ",
    name: "Перья 400 г",
    description: "Перья из твёрдых сортов пшеницы.",
    priceCents: 8200,
    stockQuantity: 130,
  },
  {
    category: "МАКАРОНЫ",
    name: "Рожки 400 г",
    description: "Рожки для супов и гарнира.",
    priceCents: 7800,
    stockQuantity: 125,
  },
  {
    category: "МАКАРОНЫ",
    name: "Вермишель 400 г",
    description: "Тонкая вермишель, быстро варится.",
    priceCents: 7500,
    stockQuantity: 110,
  },
  {
    category: "МАКАРОНЫ",
    name: "Спиральки 400 г",
    description: "Спирали хорошо держат соус.",
    priceCents: 8600,
    stockQuantity: 95,
  },
  {
    category: "МАКАРОНЫ",
    name: "Гнезда 250 г",
    description: "Гнезда из твёрдой пшеницы.",
    priceCents: 9900,
    stockQuantity: 50,
  },
  {
    category: "МАКАРОНЫ",
    name: "Листы лазаньи 250 г",
    description: "Листы для запекания лазаньи.",
    priceCents: 14500,
    stockQuantity: 40,
  },
  {
    category: "МАКАРОНЫ",
    name: "Ракушки 400 г",
    description: "Ракушки для фарширования и гарнира.",
    priceCents: 9100,
    stockQuantity: 70,
  },
  {
    category: "ЛАПША",
    name: "Лапша яичная 250 г",
    description: "Яичная лапша для супов.",
    priceCents: 10500,
    stockQuantity: 80,
  },
  {
    category: "ЛАПША",
    name: "Лапша гречневая соба 300 г",
    description: "Гречневая лапша соба.",
    priceCents: 18900,
    stockQuantity: 35,
  },
  {
    category: "ЛАПША",
    name: "Лапша рисовая 200 г",
    description: "Рисовая лапша для вока.",
    priceCents: 13200,
    stockQuantity: 48,
  },
  {
    category: "ЛАПША",
    name: "Доширак классический",
    description: "Горячий обед за 4 минуты.",
    priceCents: 6900,
    stockQuantity: 200,
  },
  {
    category: "ЛАПША",
    name: "Роллтон курица",
    description: "Лапша быстрого приготовления со вкусом курицы.",
    priceCents: 4500,
    stockQuantity: 220,
  },
  {
    category: "ЛАПША",
    name: "Лапша удон 400 г",
    description: "Толстая пшеничная лапша удон.",
    priceCents: 16800,
    stockQuantity: 42,
  },
  {
    category: "ЛАПША",
    name: "Лапша вок 300 г",
    description: "Лапша для обжарки в воке.",
    priceCents: 12100,
    stockQuantity: 55,
  },
  {
    category: "ЛАПША",
    name: "Фунчоза 200 г",
    description: "Стеклянная лапша из бобов мунг.",
    priceCents: 11500,
    stockQuantity: 38,
  },
];

export function groceryCostCents(priceCents: number, name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const ratio = 0.56 + ((hash >>> 0) % 16) / 100;
  return Math.max(80, Math.round(priceCents * ratio));
}

export async function ensureGroceryProducts(prisma: PrismaClient): Promise<void> {
  const categories = await prisma.category.findMany();
  const byName = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const item of GROCERY_PRODUCTS) {
    const categoryId = byName.get(item.category);
    if (!categoryId) {
      throw new Error(`Нет категории ${item.category}`);
    }
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });
    const costCents = groceryCostCents(item.priceCents, item.name);
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          categoryId,
          description: item.description,
          ...(existing.costCents === 0 ? { costCents } : {}),
        },
      });
      continue;
    }
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        costCents,
        stockQuantity: item.stockQuantity,
        isActive: true,
        categoryId,
      },
    });
  }
}
