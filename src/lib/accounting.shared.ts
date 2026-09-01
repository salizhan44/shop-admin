import type { OrderStatus } from "./orders.shared";

export type AccountingOrderRow = {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  status: OrderStatus;
};

export function toAccountingOrderRow(input: {
  id: string;
  createdAt: Date;
  customer: { name: string; email: string };
  totalCents: number;
  status: OrderStatus;
}): AccountingOrderRow {
  return {
    id: input.id,
    createdAt: input.createdAt.toISOString(),
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    totalCents: input.totalCents,
    status: input.status,
  };
}

export function sumConfirmedRevenue(rows: AccountingOrderRow[]): number {
  return rows.reduce(
    (sum, row) => (row.status === "CONFIRMED" ? sum + row.totalCents : sum),
    0,
  );
}

export function sumPendingTotal(rows: AccountingOrderRow[]): number {
  return rows.reduce(
    (sum, row) => (row.status === "PENDING" ? sum + row.totalCents : sum),
    0,
  );
}
