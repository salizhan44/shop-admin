import { PrismaClient } from "@prisma/client";
import { ensureDemoYearOrders } from "./seed-demo-orders";

const prisma = new PrismaClient();

ensureDemoYearOrders(prisma)
  .then(async () => {
    const yearCount = await prisma.order.count({
      where: { comment: "[demo-year]" },
    });
    console.log(`demo year orders: ${yearCount}`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
