import { prisma } from "./prisma.server";
import { hashPassword } from "./password.server";
import { customerHasPassword } from "./auth.shared";
import {
  resolveStaffCustomerPasswordReset,
  toCustomerStaffPublic,
  type CustomerStaffPublic,
} from "./customers.shared";

export async function listCustomersForStaff(): Promise<CustomerStaffPublic[]> {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  return customers.map((customer) => toCustomerStaffPublic(customer));
}

export async function resetCustomerPasswordByStaff(
  customerId: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, passwordHash: true },
  });
  if (!customer) {
    return { error: "Клиент не найден", status: 404 };
  }

  const resolved = resolveStaffCustomerPasswordReset({
    hasStoredPassword: customerHasPassword(customer.passwordHash),
    newPassword,
  });
  if ("error" in resolved) {
    return { error: resolved.error, status: 400 };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash },
    }),
    prisma.refreshToken.deleteMany({ where: { customerId } }),
  ]);
  return { ok: true };
}
