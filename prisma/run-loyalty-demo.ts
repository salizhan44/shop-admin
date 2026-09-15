import { PrismaClient } from "@prisma/client";
import { ensureLoyaltyDemoData } from "./seed-loyalty-demo";

const prisma = new PrismaClient();

ensureLoyaltyDemoData(prisma)
  .then(async () => {
    const discounted = await prisma.product.count({
      where: {
        OR: [
          { discountPercent: { not: null } },
          { discountAmountCents: { not: null } },
        ],
      },
    });
    const timed = await prisma.customer.count({
      where: { appSecondsTotal: { gt: 0 } },
    });
    console.log(`discounted products: ${discounted}; customers with session time: ${timed}`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
