import type { ProductSalesRow } from "@/lib/analytics.shared";
import { formatPriceSomLabel, formatSignedSomLabel } from "@/lib/products.shared";

export function ProductProfitList(props: {
  products: ProductSalesRow[];
  emptyText?: string;
  tone?: "up" | "down";
}) {
  if (props.products.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        {props.emptyText ?? "Подтверждённых продаж пока нет."}
      </p>
    );
  }

  const tone = props.tone ?? "up";

  return (
    <ul className="flex flex-col gap-2">
      {props.products.map((product, index) => (
        <li
          key={product.productId}
          className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70"
        >
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">
              <span className="mr-2 text-xs font-semibold text-zinc-400">
                {index + 1}
              </span>
              {product.productName}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              {product.quantitySold} шт. · выручка{" "}
              {formatPriceSomLabel(product.revenueCents)} · себест.{" "}
              {formatPriceSomLabel(product.costCents)}
            </p>
          </div>
          <span
            className={`shrink-0 text-sm font-semibold ${
              tone === "down" || product.profitCents < 0
                ? "text-red-700"
                : "text-teal-700"
            }`}
          >
            {formatSignedSomLabel(product.profitCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
