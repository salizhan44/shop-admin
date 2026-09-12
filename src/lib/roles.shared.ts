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
export const STAFF_MANAGEMENT_ROLES: readonly StaffRole[] = ["OWNER"];
export const PROMOTION_ROLES: readonly StaffRole[] = ["OWNER"];

export const ASSIGNABLE_STAFF_ROLES = [
  "WAREHOUSE",
  "ACCOUNTANT",
  "SUPPORT",
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

export function canAccessAnalytics(role: StaffRole): boolean {
  return ANALYTICS_ROLES.includes(role);
}

export function canAccessAccounting(role: StaffRole): boolean {
  return ACCOUNTING_ROLES.includes(role);
}

export function canAccessWarehouse(role: StaffRole): boolean {
  return WAREHOUSE_ROLES.includes(role);
}

/** Отдельная страница склада — только кладовщик. */
export function canViewWarehouseStockPage(role: StaffRole): boolean {
  return role === "WAREHOUSE";
}

export function canAccessSupport(role: StaffRole): boolean {
  return SUPPORT_ROLES.includes(role);
}

export function canManageCatalog(role: StaffRole): boolean {
  return CATALOG_ROLES.includes(role);
}

export function canManageStaff(role: StaffRole): boolean {
  return STAFF_MANAGEMENT_ROLES.includes(role);
}

export function canManagePromotions(role: StaffRole): boolean {
  return PROMOTION_ROLES.includes(role);
}

export function isAssignableStaffRole(value: string): value is AssignableStaffRole {
  return (ASSIGNABLE_STAFF_ROLES as readonly string[]).includes(value);
}

export function staffRoleLabel(role: StaffRole): string {
  switch (role) {
    case "OWNER":
      return "Владелец";
    case "WAREHOUSE":
      return "Склад";
    case "ACCOUNTANT":
      return "Бухгалтер";
    case "SUPPORT":
      return "Поддержка";
  }
}
