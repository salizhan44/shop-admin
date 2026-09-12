import {
  canAccessAccounting,
  canAccessAnalytics,
  canAccessSupport,
  canAccessWarehouse,
  canViewWarehouseStockPage,
  canManageCatalog,
  canManagePromotions,
  canManageStaff,
  type StaffRole,
} from "./roles.shared";

export type DashboardNavIcon =
  | "overview"
  | "orders"
  | "stock"
  | "products"
  | "promo"
  | "staff"
  | "support"
  | "analytics"
  | "accounting";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  /** Только точное совпадение пути (для «Обзор»). */
  exact?: boolean;
};

const ALL_NAV_ITEMS: Array<
  DashboardNavItem & { visible: (role: StaffRole) => boolean }
> = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: "overview",
    exact: true,
    visible: () => true,
  },
  {
    href: "/dashboard/orders",
    label: "Заказы",
    icon: "orders",
    visible: canAccessWarehouse,
  },
  {
    href: "/dashboard/stock",
    label: "Склад",
    icon: "stock",
    visible: canViewWarehouseStockPage,
  },
  {
    href: "/dashboard/products",
    label: "Ассортимент",
    icon: "products",
    visible: canManageCatalog,
  },
  {
    href: "/dashboard/promo",
    label: "Промокоды",
    icon: "promo",
    visible: canManagePromotions,
  },
  {
    href: "/dashboard/staff",
    label: "Сотрудники",
    icon: "staff",
    visible: canManageStaff,
  },
  {
    href: "/dashboard/support",
    label: "Поддержка",
    icon: "support",
    visible: canAccessSupport,
  },
  {
    href: "/dashboard/analytics",
    label: "Аналитика",
    icon: "analytics",
    visible: canAccessAnalytics,
  },
  {
    href: "/dashboard/accounting",
    label: "Учёт",
    icon: "accounting",
    visible: canAccessAccounting,
  },
];

export function getDashboardNavItems(role: StaffRole): DashboardNavItem[] {
  return ALL_NAV_ITEMS.filter((item) => item.visible(role)).map(
    ({ href, label, icon, exact }) => ({ href, label, icon, exact }),
  );
}

export function getDashboardPageTitle(
  pathname: string,
  items: readonly DashboardNavItem[],
): string {
  const exact = items.find((item) => item.exact && item.href === pathname);
  if (exact) {
    return exact.label;
  }
  const match = items
    .filter((item) => !item.exact && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Панель";
}

/** Порог «мало на складе» для сводки на обзоре. */
export const LOW_STOCK_THRESHOLD = 5;
