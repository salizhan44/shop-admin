import { prisma } from "./prisma.server";
import { hashPassword } from "./password.server";
import { isAssignableStaffRole } from "./roles.shared";
import { toStaffPublic, type StaffPublic } from "./staff.shared";

export async function listStaffUsers(): Promise<StaffPublic[]> {
  const users = await prisma.staffUser.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return users.map((user) => toStaffPublic(user));
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<StaffPublic | { error: string; status: number }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || password.length < 8) {
    return {
      error: "Имя и email обязательны, пароль — не короче 8 символов",
      status: 400,
    };
  }
  if (!isAssignableStaffRole(input.role)) {
    return { error: "Выберите роль: склад, бухгалтер или поддержка", status: 400 };
  }

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) {
    return { error: "Сотрудник с таким email уже есть", status: 409 };
  }

  const user = await prisma.staffUser.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return toStaffPublic(user);
}

export function isStaffError(
  value: StaffPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
