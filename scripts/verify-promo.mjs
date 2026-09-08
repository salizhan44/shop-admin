import assert from "node:assert/strict";
import {
  computePromoDiscount,
  normalizePromoCode,
} from "../src/lib/promo.shared";

assert.equal(normalizePromoCode("  rola10 "), "ROLA10");
assert.equal(normalizePromoCode("ab"), null);
assert.equal(normalizePromoCode("BAD*CODE"), null);

assert.equal(
  computePromoDiscount({
    kind: "PERCENT",
    percentOff: 10,
    amountOffCents: null,
    subtotalCents: 100000,
  }),
  10000,
);

assert.equal(
  computePromoDiscount({
    kind: "AMOUNT",
    percentOff: null,
    amountOffCents: 20000,
    subtotalCents: 15000,
  }),
  15000,
);

assert.equal(
  computePromoDiscount({
    kind: "AMOUNT",
    percentOff: null,
    amountOffCents: 20000,
    subtotalCents: 50000,
  }),
  20000,
);

assert.equal(
  computePromoDiscount({
    kind: "FREE_DELIVERY",
    percentOff: null,
    amountOffCents: null,
    subtotalCents: 80000,
  }),
  0,
);

assert.equal(
  computePromoDiscount({
    kind: "FREE_PRODUCT",
    percentOff: null,
    amountOffCents: null,
    subtotalCents: 80000,
  }),
  0,
);

console.log("promo invariants ok");
