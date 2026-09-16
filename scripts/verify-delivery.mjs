import assert from "node:assert/strict";
import {
  dgisRouteHttpsUrl,
  dgisSearchHttpsUrl,
  estimateEtaMinutes,
  formatEtaLabel,
  haversineKm,
  parseGeoPoint,
  toOrderDeliveryPublic,
  DEFAULT_SHOP_POINT,
} from "../src/lib/delivery.shared.ts";
import {
  STAFF_ORDER_LIST_PAGE_SIZE,
  isOrderStaffPublic,
  takeStaffOrderListPage,
  toOrderPublic,
  toOrderStaffListRow,
  toOrderStaffPublic,
} from "../src/lib/orders.shared.ts";

const near = haversineKm(DEFAULT_SHOP_POINT, {
  lat: DEFAULT_SHOP_POINT.lat + 0.02,
  lng: DEFAULT_SHOP_POINT.lng + 0.02,
});
assert.ok(near > 1 && near < 5);

assert.equal(estimateEtaMinutes(0), 12);
assert.equal(estimateEtaMinutes(200), 90);
assert.equal(formatEtaLabel(25), "~25 мин");
assert.equal(formatEtaLabel(75), "~1 ч 15 мин");

const shop = parseGeoPoint("42.87", "74.57");
assert.equal(shop.lat, 42.87);

const route = dgisRouteHttpsUrl(DEFAULT_SHOP_POINT, {
  lat: 42.9,
  lng: 74.6,
});
assert.ok(route.includes("2gis.kg/bishkek/routeSearch/rsType/car"));
assert.ok(route.includes("from/"));
assert.ok(route.includes("to/"));

const search = dgisSearchHttpsUrl("ул. Киевская 1");
assert.ok(search.includes("search/"));

const withCoords = toOrderDeliveryPublic({
  address: "ул. Киевская 1",
  destLat: 42.9,
  destLng: 74.6,
  etaMinutes: 20,
});
assert.equal(withCoords.etaMinutes, 20);
assert.ok(withCoords.dgisUrl.includes("routeSearch"));

const noCoords = toOrderDeliveryPublic({
  address: "ул. Киевская 1",
  destLat: null,
  destLng: null,
  etaMinutes: null,
});
assert.equal(noCoords.destLat, null);
assert.ok(noCoords.dgisUrl.includes("search/"));

const orderBase = {
  id: "ord_delivery_test",
  totalCents: 1000,
  phone: "+996",
  address: "ул. Киевская 1",
  comment: null,
  rejectionReason: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  destLat: 42.9,
  destLng: 74.6,
  etaMinutes: 20,
  items: [],
};

const pending = toOrderPublic({ ...orderBase, status: "PENDING" });
assert.equal(pending.etaMinutes, null);
assert.ok(pending.dgisUrl.includes("routeSearch"));

const confirmed = toOrderPublic({ ...orderBase, status: "CONFIRMED" });
assert.equal(confirmed.etaMinutes, 20);
assert.ok(confirmed.dgisUrl.includes("routeSearch"));

const staffOrder = toOrderStaffPublic({
  ...orderBase,
  status: "PENDING",
  customer: { name: "Клиент", email: "c@test.local" },
  items: [
    {
      id: "item1",
      productId: "p1",
      productName: "Мука",
      priceCents: 1000,
      quantity: 2,
      lineTotalCents: 2000,
      stockQuantityOnHand: 9,
    },
  ],
});
assert.equal(isOrderStaffPublic(staffOrder), true);
assert.equal(staffOrder.items[0]?.stockQuantityOnHand, 9);
assert.equal(
  isOrderStaffPublic(toOrderStaffPublic({
    ...orderBase,
    status: "PENDING",
    customer: { name: "Клиент", email: "c@test.local" },
    items: [],
  })),
  true,
);

const listRow = toOrderStaffListRow({
  id: orderBase.id,
  status: "PENDING",
  totalCents: orderBase.totalCents,
  createdAt: orderBase.createdAt,
  customerName: "Клиент",
});
assert.equal(listRow.customerName, "Клиент");
assert.equal(listRow.createdAt, "2026-01-01T00:00:00.000Z");
assert.ok(!("items" in listRow));
assert.ok(!("address" in listRow));
assert.equal(STAFF_ORDER_LIST_PAGE_SIZE, 40);
assert.equal(takeStaffOrderListPage([1, 2, 3], 2).length, 2);

console.log("delivery/2gis checks ok");
