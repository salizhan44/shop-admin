import { customerHasPassword } from "./auth.shared";
import { validateNewCustomerPassword } from "./customer-profile.shared";

export type CustomerStaffPublic = {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  createdAt: string;
};

export type StaffCustomerPasswordResetBody = {
  password: string;
};

export function toCustomerStaffPublic(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null | undefined;
  createdAt: Date;
}): CustomerStaffPublic {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    hasPassword: customerHasPassword(input.passwordHash),
    createdAt: input.createdAt.toISOString(),
  };
}

export function isStaffCustomerPasswordResetBody(
  value: unknown,
): value is StaffCustomerPasswordResetBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.password === "string";
}

export function filterCustomersBySearch<
  T extends { name: string; email: string },
>(customers: readonly T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...customers];
  }
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(normalized) ||
      customer.email.toLowerCase().includes(normalized),
  );
}

export function resolveStaffCustomerPasswordReset(input: {
  hasStoredPassword: boolean;
  newPassword: string;
}): { ok: true } | { error: string } {
  if (!input.hasStoredPassword) {
    return { error: "Этот аккаунт входит через Google" };
  }
  const newError = validateNewCustomerPassword(input.newPassword);
  if (newError) {
    return { error: newError };
  }
  return { ok: true };
}
