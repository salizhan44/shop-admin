import assert from "node:assert/strict";
import {
  aggregateDailySales,
  aggregateProductSales,
  fillDailySalesRange,
  pickProfitLeaders,
  nextChartZoom,
  clampChartZoom,
  chartScrollAfterZoom,
  sumLineCostCents,
  toSalesSummary,
} from "../src/lib/analytics.shared";
import {
  groupWarehouseProductsByCategory,
  toWarehouseSnapshot,
} from "../src/lib/products.shared";
import { canAccessAnalytics, canViewWarehouseStockPage } from "../src/lib/roles.shared";

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

console.log("analytics invariants ok");
