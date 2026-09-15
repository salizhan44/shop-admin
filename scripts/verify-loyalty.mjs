import assert from "node:assert/strict";
import {
  compareAtCents,
  parseProductDiscount,
  salePriceCents,
} from "../src/lib/product-discount.shared";
import {
  clampLoyaltyPointsToSpend,
  earnLoyaltyPoints,
  loyaltyPointsToCents,
  maxLoyaltyPointsForPayable,
  payableAfterLoyaltyCents,
} from "../src/lib/loyalty.shared";
import { averageCheckCents } from "../src/lib/analytics.shared";
import {
  averageAppSeconds,
  formatAppDuration,
} from "../src/lib/session-time.shared";

assert.equal(
  salePriceCents({
    priceCents: 18900,
    discountPercent: 15,
    discountAmountCents: null,
  }),
  16065,
);
assert.equal(
  compareAtCents({
    priceCents: 18900,
    discountPercent: 15,
    discountAmountCents: null,
  }),
  18900,
);
assert.equal(
  salePriceCents({
    priceCents: 14800,
    discountPercent: null,
    discountAmountCents: 2000,
  }),
  12800,
);

const parsed = parseProductDiscount({
  kind: "percent",
  percentText: "10",
  amountSom: "",
  priceCents: 10000,
});
assert.equal("error" in parsed, false);
if (!("error" in parsed)) {
  assert.equal(parsed.discountPercent, 10);
}

assert.equal(loyaltyPointsToCents(10), 1000);
assert.equal(earnLoyaltyPoints(20000), 10);
assert.equal(earnLoyaltyPoints(19999), 9);
assert.equal(maxLoyaltyPointsForPayable(80, 5000), 50);
assert.equal(
  clampLoyaltyPointsToSpend({
    requested: 999,
    balance: 40,
    payableCents: 3000,
  }),
  30,
);
assert.equal(payableAfterLoyaltyCents(5000, 20), 3000);

assert.equal(averageCheckCents(10000, 2), 5000);
assert.equal(averageCheckCents(100, 0), 0);
assert.equal(averageAppSeconds([120, 180]), 150);
assert.equal(formatAppDuration(90), "2 мин");
assert.equal(formatAppDuration(3600), "1 ч");

console.log("loyalty/discount/session checks ok");
