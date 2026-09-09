"use client";

import { useState } from "react";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import {
  formatPriceSomLabel,
  groupWarehouseProductsByCategory,
  type ProductWarehousePublic,
} from "@/lib/products.shared";

function stockTone(quantity: number): string {
  if (quantity === 0) {
    return "bg-red-50 text-red-700 ring-red-100";
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return "bg-amber-50 text-amber-800 ring-amber-100";
  }
  return "bg-zinc-100 text-zinc-700 ring-zinc-200/80";
}

function ProductCard(props: { product: ProductWarehousePublic }) {
  const product = props.product;
  return (
    <li className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover ring-1 ring-zinc-200/80"
        />
      ) : (
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-medium text-zinc-400 ring-1 ring-zinc-200/70">
          нет фото
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900">{product.name}</p>
        <p className="mt-1 text-sm text-zinc-700">
          {formatPriceSomLabel(product.priceCents)}
        </p>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${stockTone(product.stockQuantity)}`}
        >
          {product.stockQuantity} шт.
        </span>
      </div>
    </li>
  );
}

export function WarehouseCategoryList(props: {
  products: ProductWarehousePublic[];
}) {
  const groups = groupWarehouseProductsByCategory(props.products);
  const [openName, setOpenName] = useState<string | null>(
    groups[0]?.name ?? null,
  );

  if (groups.length === 0) {
    return <p className="text-sm text-zinc-600">Активных товаров пока нет.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {groups.map((group) => {
        const open = openName === group.name;
        return (
          <li
            key={group.name}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() =>
                setOpenName((current) =>
                  current === group.name ? null : group.name,
                )
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-zinc-900">
                  {group.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {group.products.length} поз. · {group.totalUnits} шт.
                </span>
              </span>
              <span
                className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {open ? (
              <ul className="grid gap-3 border-t border-zinc-100 p-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
