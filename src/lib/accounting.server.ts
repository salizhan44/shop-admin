import { prisma } from "./prisma.server";
import {
  toAccountingOrderRow,
  type AccountingOrderRow,
} from "./accounting.shared";

export async function listAccountingOrders(): Promise<AccountingOrderRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true },
      },
    },
  });

  return orders.map((order) =>
    toAccountingOrderRow({
      id: order.id,
      createdAt: order.createdAt,
      customer: order.customer,
      totalCents: order.totalCents,
      status: order.status,
    }),
  );
}
