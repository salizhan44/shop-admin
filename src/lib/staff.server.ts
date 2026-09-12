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

export async function updateStaffUser(
  staffId: string,
  input: {
    name: string;
    email: string;
    role: string;
    password?: string;
  },
): Promise<StaffPublic | { error: string; status: number }> {
  const existing = await prisma.staffUser.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      role: true,
    },
  });
  if (!existing) {
    return { error: "Сотрудник не найден", status: 404 };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name || !email) {
    return { error: "Имя и email обязательны", status: 400 };
  }
  if (password !== undefined && password.length > 0 && password.length < 8) {
    return { error: "Пароль — не короче 8 символов", status: 400 };
  }

  const nextRole =
    existing.role === "OWNER"
      ? "OWNER"
      : isAssignableStaffRole(input.role)
        ? input.role
        : null;
  if (!nextRole) {
    return { error: "Выберите роль: склад, бухгалтер или поддержка", status: 400 };
  }

  const conflict = await prisma.staffUser.findFirst({
    where: { email, NOT: { id: staffId } },
    select: { id: true },
  });
  if (conflict) {
    return { error: "Сотрудник с таким email уже есть", status: 409 };
  }

  const user = await prisma.staffUser.update({
    where: { id: staffId },
    data: {
      name,
      email,
      role: nextRole,
      ...(password && password.length >= 8
        ? { passwordHash: await hashPassword(password) }
        : {}),
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
