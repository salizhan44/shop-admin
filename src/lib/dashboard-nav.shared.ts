import {
  canAccessAccounting,
  canAccessAnalytics,
  canAccessSupport,
  canAccessWarehouse,
  canManageCatalog,
  canManagePromotions,
  canManageStaff,
  type StaffRole,
} from "./roles.shared";

export type DashboardNavItem = {
  href: string;
  label: string;
  /** Только точное совпадение пути (для «Обзор»). */
  exact?: boolean;
};

const ALL_NAV_ITEMS: Array<
  DashboardNavItem & { visible: (role: StaffRole) => boolean }
> = [
  {
    href: "/dashboard",
    label: "Обзор",
    exact: true,
    visible: () => true,
  },
  {
    href: "/dashboard/orders",
    label: "Заказы",
    visible: canAccessWarehouse,
  },
  {
    href: "/dashboard/stock",
    label: "Остатки",
    visible: canAccessWarehouse,
  },
  {
    href: "/dashboard/products",
    label: "Ассортимент",
    visible: canManageCatalog,
  },
  {
    href: "/dashboard/promo",
    label: "Промокоды",
    visible: canManagePromotions,
  },
  {
    href: "/dashboard/staff",
    label: "Сотрудники",
    visible: canManageStaff,
  },
  {
    href: "/dashboard/support",
    label: "Поддержка",
    visible: canAccessSupport,
  },
  {
    href: "/dashboard/analytics",
    label: "Аналитика",
    visible: canAccessAnalytics,
  },
  {
    href: "/dashboard/accounting",
    label: "Учёт",
    visible: canAccessAccounting,
  },
];

export function getDashboardNavItems(role: StaffRole): DashboardNavItem[] {
  return ALL_NAV_ITEMS.filter((item) => item.visible(role)).map(
    ({ href, label, exact }) => ({ href, label, exact }),
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
