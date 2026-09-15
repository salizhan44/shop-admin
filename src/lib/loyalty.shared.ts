/** 1 балл = 1 сом при оплате. */
export const LOYALTY_POINT_VALUE_CENTS = 100;

/**
 * Начисление: 1 балл за каждые 20 сом, оплаченные деньгами (5%).
 * 10% (100 сом → 10 баллов) съедает маржу бакалеи.
 */
export const LOYALTY_EARN_CENTS_PER_POINT = 2000;

export function loyaltyPointsToCents(points: number): number {
  const safe = Math.max(0, Math.floor(points));
  return safe * LOYALTY_POINT_VALUE_CENTS;
}

export function maxLoyaltyPointsForPayable(
  balance: number,
  payableCents: number,
): number {
  if (balance <= 0 || payableCents <= 0) {
    return 0;
  }
  const byMoney = Math.floor(payableCents / LOYALTY_POINT_VALUE_CENTS);
  return Math.max(0, Math.min(Math.floor(balance), byMoney));
}

export function clampLoyaltyPointsToSpend(input: {
  requested: number;
  balance: number;
  payableCents: number;
}): number {
  if (!Number.isFinite(input.requested) || input.requested <= 0) {
    return 0;
  }
  const max = maxLoyaltyPointsForPayable(input.balance, input.payableCents);
  return Math.min(max, Math.floor(input.requested));
}

export function earnLoyaltyPoints(cashPaidCents: number): number {
  if (cashPaidCents <= 0) {
    return 0;
  }
  return Math.floor(cashPaidCents / LOYALTY_EARN_CENTS_PER_POINT);
}

export function payableAfterLoyaltyCents(
  payableBeforePointsCents: number,
  pointsToSpend: number,
): number {
  return Math.max(
    0,
    payableBeforePointsCents - loyaltyPointsToCents(pointsToSpend),
  );
}
