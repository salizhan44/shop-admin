import {
  isAssignableStaffRole,
  staffRoleLabel,
  type AssignableStaffRole,
  type StaffRole,
} from "./roles.shared";

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

export type StaffUpdateBody = {
  name: string;
  email: string;
  role: AssignableStaffRole | "OWNER";
  password?: string;
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

export function isStaffUpdateBody(value: unknown): value is StaffUpdateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.role !== "string"
  ) {
    return false;
  }
  if (body.password !== undefined && typeof body.password !== "string") {
    return false;
  }
  return true;
}

export function filterStaffBySearch<
  T extends { name: string; email: string; role: StaffRole },
>(staff: readonly T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...staff];
  }
  return staff.filter((member) => {
    const role = staffRoleLabel(member.role).toLowerCase();
    return (
      member.name.toLowerCase().includes(normalized) ||
      member.email.toLowerCase().includes(normalized) ||
      role.includes(normalized)
    );
  });
}

export function isStaffRoleEditable(role: StaffRole): boolean {
  return isAssignableStaffRole(role);
}
