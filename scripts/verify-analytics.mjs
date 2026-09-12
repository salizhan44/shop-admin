import assert from "node:assert/strict";
import {
  aggregateCategorySales,
  aggregateDailySales,
  aggregateProductSales,
  categorySalesPercents,
  fillDailySalesRange,
  formatCategorySalesPercent,
  pickProfitLeaders,
  nextChartZoom,
  clampChartZoom,
  chartScrollAfterZoom,
  sumLineCostCents,
  toSalesSummary,
} from "../src/lib/analytics.shared";
import {
  analyticsTrendDirection,
  buildAnalyticsWeekSnapshot,
  formatWeekChangePercent,
  weekChangePercent,
  weekWindowDateKeys,
} from "../src/lib/analytics-week.shared";
import {
  aggregateMonthlySales,
  countOverviewOrderStatuses,
  fillMonthlySalesRange,
  formatReportMonthShort,
  overviewBarWidthPercent,
  overviewOrderActivityText,
  pickOverviewActivity,
} from "../src/lib/overview.shared";
import {
  UNCATEGORIZED_CATALOG_FILTER_ID,
  UNCATEGORIZED_SUBCATEGORY_FILTER_ID,
  filterCatalogProducts,
  filterCatalogProductsBySearch,
  groupCatalogProductsByCategory,
  normalizeCatalogSearchQuery,
  groupWarehouseProductsByCategory,
  toWarehouseSnapshot,
} from "../src/lib/products.shared";
import { canAccessAnalytics, canViewWarehouseStockPage } from "../src/lib/roles.shared";
import {
  filterStaffOrders,
  formatOrderShortId,
  orderStatusLabel,
  orderStatusTone,
} from "../src/lib/orders.shared";
import {
  ADMIN_MENU_ACTIVE_BG,
  ADMIN_MENU_ACTIVE_TEXT,
  ADMIN_MENU_BG,
  statusBadgeClass,
} from "../src/lib/ui.shared";
import {
  getDashboardNavItems,
  getDashboardPageTitle,
} from "../src/lib/dashboard-nav.shared";
import {
  parseStaffPresenceStatus,
  staffDirectoryPresence,
  staffDirectoryPresenceLabel,
  staffInitials,
  staffPresenceLabel,
  staffPresenceStorageKey,
} from "../src/lib/staff-presence.shared";
import { filterStaffBySearch, isStaffUpdateBody } from "../src/lib/staff.shared";

const summary = toSalesSummary({
  confirmedOrderCount: 2,
  confirmedRevenueCents: 10000,
  confirmedCostCents: 4000,
  pendingOrderCount: 1,
  pendingTotalCents: 500,
  rejectedOrderCount: 0,
});
assert.equal(summary.confirmedProfitCents, 6000);

assert.equal(
  sumLineCostCents([
    { quantity: 2, unitCostCents: 100 },
    { quantity: 1, unitCostCents: 50 },
  ]),
  250,
);

const daily = aggregateDailySales([
  { createdAt: "2026-09-01T10:00:00.000Z", totalCents: 1000, costCents: 400 },
  { createdAt: "2026-09-01T18:00:00.000Z", totalCents: 500, costCents: 200 },
  { createdAt: "2026-09-02T09:00:00.000Z", totalCents: 800, costCents: 300 },
]);
assert.equal(daily[0]?.date, "2026-09-01");
assert.equal(daily[0]?.orderCount, 2);
assert.equal(daily[0]?.revenueCents, 1500);
assert.equal(daily[0]?.profitCents, 900);
assert.equal(daily[1]?.profitCents, 500);

const filled = fillDailySalesRange(daily, 3, new Date("2026-09-02T12:00:00"));
assert.equal(filled.length, 3);
assert.equal(filled[0]?.date, "2026-08-31");
assert.equal(filled[0]?.revenueCents, 0);
assert.equal(filled[2]?.date, "2026-09-02");
assert.equal(filled[2]?.orderCount, 1);

const top = aggregateProductSales([
  {
    productId: "cheap",
    productName: "Дешёвый",
    quantity: 10,
    lineTotalCents: 1000,
    unitCostCents: 80,
  },
  {
    productId: "good",
    productName: "Выгодный",
    quantity: 2,
    lineTotalCents: 2000,
    unitCostCents: 200,
  },
]);
assert.equal(top[0]?.productId, "good");
assert.equal(top[0]?.profitCents, 1600);
assert.equal(top[1]?.profitCents, 200);

const ranked = pickProfitLeaders(
  [
    { productId: "a", productName: "A", quantitySold: 1, revenueCents: 500, costCents: 100, profitCents: 400 },
    { productId: "b", productName: "B", quantitySold: 1, revenueCents: 300, costCents: 100, profitCents: 200 },
    { productId: "c", productName: "C", quantitySold: 1, revenueCents: 200, costCents: 150, profitCents: 50 },
    { productId: "d", productName: "D", quantitySold: 1, revenueCents: 100, costCents: 90, profitCents: 10 },
    { productId: "e", productName: "E", quantitySold: 1, revenueCents: 80, costCents: 80, profitCents: 0 },
    { productId: "f", productName: "F", quantitySold: 1, revenueCents: 50, costCents: 70, profitCents: -20 },
  ],
  5,
);
assert.equal(ranked.top.length, 5);
assert.equal(ranked.top[0]?.productId, "a");
assert.equal(ranked.bottom.length, 5);
assert.equal(ranked.bottom[0]?.productId, "f");
assert.equal(ranked.bottom[4]?.productId, "b");

const categoryShares = aggregateCategorySales(
  [
    { categoryId: "flour", categoryName: "МУКА", revenueCents: 300 },
    { categoryId: "flour", categoryName: "МУКА", revenueCents: 100 },
    { categoryId: "pasta", categoryName: "МАКАРОНЫ", revenueCents: 100 },
    { categoryId: null, categoryName: null, revenueCents: 0 },
  ],
  "Без категории",
  "__uncategorized__",
);
assert.equal(categoryShares.length, 2);
assert.equal(categoryShares[0]?.categoryName, "МУКА");
assert.equal(categoryShares[0]?.revenueCents, 400);
assert.equal(categoryShares[0]?.percent, 80);
assert.equal(categoryShares[1]?.categoryName, "МАКАРОНЫ");
assert.equal(categoryShares[1]?.percent, 20);

const uncategorizedShares = aggregateCategorySales(
  [{ categoryId: null, categoryName: "  ", revenueCents: 50 }],
  "Без категории",
  "__uncategorized__",
);
assert.equal(uncategorizedShares[0]?.categoryId, "__uncategorized__");
assert.equal(uncategorizedShares[0]?.categoryName, "Без категории");
assert.equal(uncategorizedShares[0]?.percent, 100);
assert.equal(formatCategorySalesPercent(100), "100%");
assert.deepEqual(categorySalesPercents([1, 1, 1]), [33.4, 33.3, 33.3]);

assert.equal(weekChangePercent(150, 100), 50);
assert.equal(weekChangePercent(50, 100), -50);
assert.equal(weekChangePercent(0, 0), 0);
assert.equal(weekChangePercent(100, 0), null);
assert.equal(formatWeekChangePercent(12.5), "+12.5%");
assert.equal(formatWeekChangePercent(-8), "-8%");
assert.equal(formatWeekChangePercent(null), "—");
assert.equal(analyticsTrendDirection(-8, 50), "down");
assert.equal(analyticsTrendDirection(12, 50), "up");

const weekWindow = weekWindowDateKeys(new Date("2026-09-12T15:00:00"));
assert.equal(weekWindow.currentEnd, "2026-09-12");
assert.equal(weekWindow.currentStart, "2026-09-06");
assert.equal(weekWindow.previousEnd, "2026-09-05");
assert.equal(weekWindow.previousStart, "2026-08-30");

const weekSnapshot = buildAnalyticsWeekSnapshot(
  [
    {
      categoryId: "flour",
      categoryName: "МУКА",
      date: "2026-09-10",
      revenueCents: 300,
      costCents: 100,
    },
    {
      categoryId: "flour",
      categoryName: "МУКА",
      date: "2026-09-01",
      revenueCents: 200,
      costCents: 80,
    },
    {
      categoryId: "pasta",
      categoryName: "МАКАРОНЫ",
      date: "2026-09-08",
      revenueCents: 80,
      costCents: 30,
    },
    {
      categoryId: null,
      categoryName: null,
      date: "2026-09-11",
      revenueCents: 40,
      costCents: 10,
    },
    {
      categoryId: null,
      categoryName: null,
      date: "2026-09-02",
      revenueCents: 80,
      costCents: 20,
    },
  ],
  [
    { id: "flour", name: "МУКА" },
    { id: "pasta", name: "МАКАРОНЫ" },
    { id: "noodles", name: "ЛАПША" },
  ],
  "Без категории",
  "__uncategorized__",
  weekWindow,
  3,
);
assert.equal(weekSnapshot.overall.current.revenueCents, 420);
assert.equal(weekSnapshot.overall.current.profitCents, 280);
assert.equal(weekSnapshot.overall.previous.revenueCents, 280);
assert.equal(weekSnapshot.overall.revenueChangePercent, 50);
assert.equal(weekSnapshot.categories.length, 3);
assert.equal(weekSnapshot.categories[0]?.categoryName, "МУКА");
assert.equal(weekSnapshot.categories[1]?.categoryName, "МАКАРОНЫ");
assert.equal(weekSnapshot.categories[2]?.categoryName, "ЛАПША");
assert.equal(weekSnapshot.uncategorized.categoryName, "Без категории");
assert.equal(weekSnapshot.uncategorized.current.revenueCents, 40);
assert.equal(weekSnapshot.uncategorized.revenueChangePercent, -50);

const monthly = aggregateMonthlySales([
  { createdAt: "2026-08-01", totalCents: 1000, costCents: 400 },
  { createdAt: "2026-08-20", totalCents: 500, costCents: 200 },
  { createdAt: "2026-09-02", totalCents: 800, costCents: 300 },
]);
assert.equal(monthly[0]?.month, "2026-08");
assert.equal(monthly[0]?.orderCount, 2);
assert.equal(monthly[0]?.revenueCents, 1500);
assert.equal(monthly[0]?.profitCents, 900);
assert.equal(monthly[1]?.month, "2026-09");
assert.equal(monthly[1]?.profitCents, 500);

const filledMonths = fillMonthlySalesRange(
  monthly,
  3,
  new Date("2026-09-12T12:00:00"),
);
assert.equal(filledMonths.length, 3);
assert.equal(filledMonths[0]?.month, "2026-07");
assert.equal(filledMonths[0]?.revenueCents, 0);
assert.equal(filledMonths[2]?.month, "2026-09");
assert.equal(formatReportMonthShort("2026-09", 2026), "сен");
assert.equal(formatReportMonthShort("2025-01", 2026), "янв 25");
assert.equal(overviewBarWidthPercent(50, 200), 25);
assert.equal(overviewBarWidthPercent(0, 200), 0);

const overviewCounts = countOverviewOrderStatuses([
  { status: "PENDING" },
  { status: "PENDING" },
  { status: "CONFIRMED" },
  { status: "REJECTED" },
]);
assert.equal(overviewCounts.pending, 2);
assert.equal(overviewCounts.confirmed, 1);
assert.equal(overviewCounts.rejected, 1);
assert.equal(
  overviewOrderActivityText("CONFIRMED", "order000m83kfj8"),
  "Заказ 0M83KFJ8 принят",
);
assert.equal(
  overviewOrderActivityText("REJECTED", "order000m83kfj8"),
  "Заказ 0M83KFJ8 отклонён",
);
assert.equal(pickOverviewActivity([1, 2, 3, 4], 2).length, 2);

const grouped = groupWarehouseProductsByCategory([
  {
    id: "a",
    name: "A",
    priceCents: 100,
    stockQuantity: 2,
    imageUrl: "",
    categoryName: "МУКА",
  },
  {
    id: "c",
    name: "C",
    priceCents: 10,
    stockQuantity: 1,
    imageUrl: "",
    categoryName: "МУКА",
  },
  {
    id: "b",
    name: "B",
    priceCents: 50,
    stockQuantity: 0,
    imageUrl: "",
    categoryName: null,
  },
]);
assert.equal(grouped[0]?.name, "МУКА");
assert.equal(grouped[0]?.products.length, 2);
assert.equal(grouped[0]?.totalUnits, 3);
assert.equal(grouped[1]?.name, "Без категории");

function sampleCatalogProduct(overrides) {
  return {
    id: "x",
    name: "X",
    description: "",
    priceCents: 100,
    imageUrl: "",
    categoryId: null,
    subcategoryId: null,
    isActive: true,
    stockQuantity: 1,
    costCents: 0,
    categoryName: null,
    subcategoryName: null,
    ...overrides,
  };
}

const catalogGroups = groupCatalogProductsByCategory([
  sampleCatalogProduct({
    id: "a",
    name: "A",
    categoryId: "flour",
    categoryName: "МУКА",
    subcategoryId: "premium",
    subcategoryName: "Высший сорт",
  }),
  sampleCatalogProduct({
    id: "c",
    name: "C",
    categoryId: "flour",
    categoryName: "МУКА",
  }),
  sampleCatalogProduct({
    id: "b",
    name: "B",
  }),
]);
assert.equal(catalogGroups[0]?.name, "МУКА");
assert.equal(catalogGroups[0]?.products.length, 2);
assert.equal(catalogGroups[0]?.subgroups[0]?.name, "Высший сорт");
assert.equal(catalogGroups[0]?.subgroups[1]?.name, "Без подкатегории");
assert.equal(catalogGroups[1]?.name, "Без категории");
assert.equal(catalogGroups[1]?.key, UNCATEGORIZED_CATALOG_FILTER_ID);

const onlyFlour = filterCatalogProducts(
  [
    sampleCatalogProduct({
      id: "a",
      categoryId: "flour",
      categoryName: "МУКА",
      subcategoryId: "premium",
      subcategoryName: "Высший сорт",
    }),
    sampleCatalogProduct({ id: "b" }),
  ],
  "flour",
  null,
);
assert.equal(onlyFlour.length, 1);
assert.equal(onlyFlour[0]?.id, "a");

const uncategorizedOnly = filterCatalogProducts(
  [
    sampleCatalogProduct({ id: "a", categoryId: "flour", categoryName: "МУКА" }),
    sampleCatalogProduct({ id: "b" }),
  ],
  UNCATEGORIZED_CATALOG_FILTER_ID,
  null,
);
assert.equal(uncategorizedOnly.length, 1);
assert.equal(uncategorizedOnly[0]?.id, "b");

const bySub = filterCatalogProducts(
  [
    sampleCatalogProduct({
      id: "a",
      categoryId: "flour",
      categoryName: "МУКА",
      subcategoryId: "premium",
      subcategoryName: "Высший сорт",
    }),
    sampleCatalogProduct({
      id: "c",
      categoryId: "flour",
      categoryName: "МУКА",
    }),
  ],
  "flour",
  UNCATEGORIZED_SUBCATEGORY_FILTER_ID,
);
assert.equal(bySub.length, 1);
assert.equal(bySub[0]?.id, "c");

assert.equal(normalizeCatalogSearchQuery("  Мука  "), "мука");
const searchHits = filterCatalogProductsBySearch(
  [
    sampleCatalogProduct({ id: "a", name: "Мука высший сорт" }),
    sampleCatalogProduct({ id: "b", name: "Макароны" }),
  ],
  "высш",
);
assert.equal(searchHits.length, 1);
assert.equal(searchHits[0]?.id, "a");
assert.equal(
  filterCatalogProductsBySearch(
    [sampleCatalogProduct({ id: "a", name: "Мука" })],
    "   ",
  ).length,
  1,
);

const warehouse = toWarehouseSnapshot(
  [
    {
      id: "a",
      name: "A",
      priceCents: 100,
      stockQuantity: 2,
      imageUrl: "",
      categoryName: "МУКА",
    },
    {
      id: "b",
      name: "B",
      priceCents: 50,
      stockQuantity: 0,
      imageUrl: "",
      categoryName: null,
    },
  ],
  5,
);
assert.equal(warehouse.productCount, 2);
assert.equal(warehouse.totalUnits, 2);
assert.equal(warehouse.lowStockCount, 1);
assert.equal(warehouse.outOfStockCount, 1);
assert.equal(warehouse.retailValueCents, 200);

assert.equal(canAccessAnalytics("WAREHOUSE"), false);
assert.equal(canViewWarehouseStockPage("WAREHOUSE"), true);
assert.equal(canViewWarehouseStockPage("OWNER"), false);

assert.equal(clampChartZoom(0.5), 1);
assert.equal(clampChartZoom(20), 8);
assert.ok(nextChartZoom(1, -100) > 1);
assert.equal(nextChartZoom(1, 100), 1);
assert.equal(
  chartScrollAfterZoom({
    contentX: 200,
    cursorOffsetX: 50,
    oldZoom: 1,
    newZoom: 2,
  }),
  350,
);
assert.equal(
  chartScrollAfterZoom({
    contentX: 256,
    cursorOffsetX: 50,
    oldZoom: 1,
    newZoom: 2,
    padLeft: 56,
  }),
  406,
);

assert.equal(orderStatusLabel("PENDING"), "Ожидает");
assert.equal(orderStatusTone("PENDING"), "pending");
assert.equal(orderStatusTone("CONFIRMED"), "ok");
assert.equal(orderStatusTone("REJECTED"), "bad");
assert.ok(statusBadgeClass("pending").includes("amber"));
assert.equal(formatOrderShortId("abcdefghijklmnop"), "IJKLMNOP");
const filteredOrders = filterStaffOrders(
  [{ status: "PENDING" }, { status: "CONFIRMED" }, { status: "REJECTED" }],
  "PENDING",
);
assert.equal(filteredOrders.length, 1);
assert.equal(filteredOrders[0]?.status, "PENDING");
assert.equal(
  filterStaffOrders(
    [{ status: "PENDING" }, { status: "CONFIRMED" }],
    "all",
  ).length,
  2,
);

const ownerNav = getDashboardNavItems("OWNER");
assert.equal(ownerNav[0]?.icon, "overview");
assert.equal(
  getDashboardPageTitle("/dashboard/orders", ownerNav),
  "Заказы",
);
assert.equal(staffPresenceLabel("lunch"), "На обеде");
assert.equal(parseStaffPresenceStatus("offline"), "offline");
assert.equal(parseStaffPresenceStatus("nope"), "online");
assert.equal(staffInitials("Иван Петров"), "ИП");
assert.equal(
  staffPresenceStorageKey("Owner@Local.Test"),
  "staff-presence:owner@local.test",
);
assert.equal(staffDirectoryPresence("alina.sklad@local.test", "online"), "online");
assert.equal(staffDirectoryPresence("x", "offline"), "offline");
assert.equal(staffDirectoryPresence("x", "lunch"), "offline");
assert.equal(staffDirectoryPresenceLabel("online"), "Онлайн");
assert.equal(
  filterStaffBySearch(
    [
      { name: "Алина Козлова", email: "alina@test", role: "WAREHOUSE" },
      { name: "Борис Новиков", email: "boris@test", role: "ACCOUNTANT" },
    ],
    "бух",
  ).length,
  1,
);
assert.equal(
  filterStaffBySearch(
    [{ name: "Алина Козлова", email: "alina@test", role: "WAREHOUSE" }],
    "",
  ).length,
  1,
);
assert.equal(
  isStaffUpdateBody({ name: "Алина", email: "a@test", role: "WAREHOUSE" }),
  true,
);
assert.equal(isStaffUpdateBody({ name: "Алина" }), false);

assert.equal(ADMIN_MENU_BG, "#061e3a");
assert.equal(ADMIN_MENU_ACTIVE_BG, "#3a4758");
assert.equal(ADMIN_MENU_ACTIVE_TEXT, "#d7b168");

console.log("analytics invariants ok");
