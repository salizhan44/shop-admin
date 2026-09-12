"use client";

import { useMemo, useState } from "react";
import {
  filterCatalogProductsBySearch,
  formatPriceSomLabel,
  normalizeCatalogSearchQuery,
  type CategoryOptionPublic,
  type ProductAdmin,
} from "@/lib/products.shared";
import { ADMIN_MENU_BG, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { CatalogSearchField } from "./catalog-search-field";
import { ProductForm } from "./product-form";

export function CatalogProductList(props: {
  products: ProductAdmin[];
  categories: CategoryOptionPublic[];
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAdmin | null>(null);

  const visibleProducts = useMemo(
    () => filterCatalogProductsBySearch(props.products, searchApplied),
    [props.products, searchApplied],
  );

  function onApplySearch() {
    setSearchApplied(normalizeCatalogSearchQuery(searchDraft));
  }

  function onClearSearch() {
    setSearchDraft("");
    setSearchApplied("");
  }

  function onCloseEditor() {
    setCreateOpen(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <CatalogSearchField
          value={searchDraft}
          showClear={searchDraft.length > 0 || searchApplied.length > 0}
          onChange={setSearchDraft}
          onSubmit={onApplySearch}
          onClear={onClearSearch}
        />
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreateOpen(true);
          }}
          className="inline-flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: ADMIN_MENU_BG }}
        >
          Добавить товар
        </button>
      </div>

      {props.products.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет товаров</p>
      ) : visibleProducts.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет товаров</p>
      ) : (
        <ul className="grid grid-cols-2 gap-[0.975rem] md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                onEdit={() => {
                  setCreateOpen(false);
                  setEditing(product);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <ProductForm
        key={editing?.id ?? "create"}
        categories={props.categories}
        product={editing ?? undefined}
        open={createOpen || editing !== null}
        onClose={onCloseEditor}
      />
    </div>
  );
}

function ProductCard(props: {
  product: ProductAdmin;
  onEdit: () => void;
}) {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-[0_10px_28px_rgba(6,30,58,0.10)]"
    >
      {props.product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={props.product.imageUrl}
          alt=""
          className="aspect-square w-full rounded-xl object-cover ring-1 ring-zinc-200/80"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80">
          ▦
        </div>
      )}
      <p className="mt-3 truncate font-medium text-zinc-900">
        {props.product.name}
      </p>
      <p className="mt-1 text-sm text-zinc-700">
        {formatPriceSomLabel(props.product.priceCents)}{" "}
        <span className="text-zinc-500">{`(${formatPriceSomLabel(props.product.costCents)})`}</span>
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <p className="text-sm text-zinc-500">
          Остаток: {props.product.stockQuantity}
        </p>
        <button
          type="button"
          onClick={props.onEdit}
          aria-label="Редактировать"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:opacity-90"
          style={{ backgroundColor: ADMIN_MENU_BG }}
        >
          <EditIcon />
        </button>
      </div>
    </article>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M12.6 4.4 15.6 7.4 7.8 15.2H4.8v-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 5.8 14.2 8.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
