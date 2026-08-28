import type { AssignableStaffRole, StaffRole } from "./roles.shared";

export type StaffPublic = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
};

export type StaffCreateBody = {
  name: string;
  email: string;
  password: string;
  role: AssignableStaffRole;
};

export function isStaffCreateBody(value: unknown): value is StaffCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.name === "string" &&
    typeof body.email === "string" &&
    typeof body.password === "string" &&
    typeof body.role === "string"
  );
}

export function toStaffPublic(input: {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: Date;
}): StaffPublic {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    createdAt: input.createdAt.toISOString(),
  };
}
