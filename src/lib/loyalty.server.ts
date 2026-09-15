import type { Prisma } from "@prisma/client";
import { earnLoyaltyPoints } from "./loyalty.shared";

export async function spendCustomerPoints(
  tx: Prisma.TransactionClient,
  customerId: string,
  points: number,
): Promise<{ ok: true } | { error: string; status: number }> {
  if (points <= 0) {
    return { ok: true };
  }
  const updated = await tx.customer.updateMany({
    where: { id: customerId, loyaltyPoints: { gte: points } },
    data: { loyaltyPoints: { decrement: points } },
  });
  if (updated.count !== 1) {
    return { error: "Недостаточно баллов", status: 400 };
  }
  return { ok: true };
}

export async function refundCustomerPoints(
  tx: Prisma.TransactionClient,
  customerId: string,
  points: number,
): Promise<void> {
  if (points <= 0) {
    return;
  }
  await tx.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: { increment: points } },
  });
}

export async function awardEarnedPoints(
  tx: Prisma.TransactionClient,
  input: { customerId: string; cashPaidCents: number },
): Promise<number> {
  const earned = earnLoyaltyPoints(input.cashPaidCents);
  if (earned <= 0) {
    return 0;
  }
  await tx.customer.update({
    where: { id: input.customerId },
    data: { loyaltyPoints: { increment: earned } },
  });
  return earned;
}
