export const STAFF_ROLES = [
  "OWNER",
  "WAREHOUSE",
  "ACCOUNTANT",
  "SUPPORT",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ANALYTICS_ROLES: readonly StaffRole[] = ["OWNER"];
export const ACCOUNTING_ROLES: readonly StaffRole[] = ["OWNER", "ACCOUNTANT"];
export const WAREHOUSE_ROLES: readonly StaffRole[] = ["OWNER", "WAREHOUSE"];
export const SUPPORT_ROLES: readonly StaffRole[] = ["OWNER", "SUPPORT"];
export const CATALOG_ROLES: readonly StaffRole[] = ["OWNER"];

export function canAccessAnalytics(role: StaffRole): boolean {
  return ANALYTICS_ROLES.includes(role);
}

export function canAccessAccounting(role: StaffRole): boolean {
  return ACCOUNTING_ROLES.includes(role);
}

export function canAccessWarehouse(role: StaffRole): boolean {
  return WAREHOUSE_ROLES.includes(role);
}

export function canAccessSupport(role: StaffRole): boolean {
  return SUPPORT_ROLES.includes(role);
}

export function canManageCatalog(role: StaffRole): boolean {
  return CATALOG_ROLES.includes(role);
}
