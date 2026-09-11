"use client";

import { useEffect, useMemo, useState } from "react";
import {
  UNCATEGORIZED_CATALOG_FILTER_ID,
  UNCATEGORIZED_SUBCATEGORY_FILTER_ID,
  UNCATEGORIZED_WAREHOUSE_LABEL,
  filterCatalogProducts,
  formatPriceSomLabel,
  groupCatalogProductsByCategory,
  type CatalogCategoryGroup,
  type CategoryOptionPublic,
  type ProductAdmin,
} from "@/lib/products.shared";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { ProductDeleteButton } from "./product-delete-button";
import { ProductForm } from "./product-form";
import { StockAdjust } from "./stock-adjust";

export function CatalogProductList(props: {
  products: ProductAdmin[];
  categories: CategoryOptionPublic[];
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [openCategoryKey, setOpenCategoryKey] = useState<
    string | null | undefined
  >(undefined);
  const [openSubKey, setOpenSubKey] = useState<string | null | undefined>(
    undefined,
  );

  const visibleProducts = useMemo(
    () => filterCatalogProducts(props.products, categoryId, subcategoryId),
    [props.products, categoryId, subcategoryId],
  );
  const groups = useMemo(
    () => groupCatalogProductsByCategory(visibleProducts),
    [visibleProducts],
  );

  useEffect(() => {
    setOpenCategoryKey(undefined);
    setOpenSubKey(undefined);
  }, [categoryId, subcategoryId]);

  const resolvedCategoryKey =
    openCategoryKey === undefined ? (groups[0]?.key ?? null) : openCategoryKey;
  const resolvedSubKey =
    openSubKey === undefined
      ? (groups.find((group) => group.key === resolvedCategoryKey)?.subgroups[0]
          ?.key ?? null)
      : openSubKey;

  const hasUncategorized = props.products.some((product) => !product.categoryId);
  const selectedCategory = props.categories.find((item) => item.id === categoryId);
  const showSubcategoryChips = Boolean(
    selectedCategory && selectedCategory.subcategories.length > 0,
  );

  function selectCategory(nextId: string | null) {
    setCategoryId(nextId);
    setSubcategoryId(null);
  }

  if (props.products.length === 0) {
    return <p className={UI_MUTED_CLASS}>Нет товаров</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Все"
          active={categoryId === null}
          onClick={() => selectCategory(null)}
        />
        {props.categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onClick={() => selectCategory(category.id)}
          />
        ))}
        {hasUncategorized ? (
          <FilterChip
            label={UNCATEGORIZED_WAREHOUSE_LABEL}
            active={categoryId === UNCATEGORIZED_CATALOG_FILTER_ID}
            onClick={() => selectCategory(UNCATEGORIZED_CATALOG_FILTER_ID)}
          />
        ) : null}
      </div>

      {showSubcategoryChips && selectedCategory ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Все"
            active={subcategoryId === null}
            onClick={() => setSubcategoryId(null)}
          />
          {selectedCategory.subcategories.map((subcategory) => (
            <FilterChip
              key={subcategory.id}
              label={subcategory.name}
              active={subcategoryId === subcategory.id}
              onClick={() => setSubcategoryId(subcategory.id)}
            />
          ))}
          {props.products.some(
            (product) =>
              product.categoryId === selectedCategory.id && !product.subcategoryId,
          ) ? (
            <FilterChip
              label="Без подкатегории"
              active={subcategoryId === UNCATEGORIZED_SUBCATEGORY_FILTER_ID}
              onClick={() =>
                setSubcategoryId(UNCATEGORIZED_SUBCATEGORY_FILTER_ID)
              }
            />
          ) : null}
        </div>
      ) : null}

      {visibleProducts.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет товаров</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <CategoryBlock
              key={group.key}
              group={group}
              categories={props.categories}
              open={resolvedCategoryKey === group.key}
              openSubKey={resolvedSubKey}
              onToggle={() =>
                setOpenCategoryKey(
                  resolvedCategoryKey === group.key ? null : group.key,
                )
              }
              onToggleSub={(key) =>
                setOpenSubKey(resolvedSubKey === key ? null : key)
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryBlock(props: {
  group: CatalogCategoryGroup;
  categories: CategoryOptionPublic[];
  open: boolean;
  openSubKey: string | null;
  onToggle: () => void;
  onToggleSub: (key: string) => void;
}) {
  const nestSubs = props.group.subgroups.length > 1;

  return (
    <li className={`overflow-hidden ${UI_CARD_CLASS}`}>
      <button
        type="button"
        aria-expanded={props.open}
        onClick={props.onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-zinc-900">
            {props.group.name}
          </span>
          <span className="text-xs text-zinc-500">
            {props.group.products.length} поз.
          </span>
        </span>
        <span
          className={`shrink-0 text-zinc-400 transition ${props.open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {props.open ? (
        nestSubs ? (
          <ul className="flex flex-col gap-2 border-t border-zinc-100 p-2">
            {props.group.subgroups.map((subgroup) => {
              const open = props.openSubKey === subgroup.key;
              return (
                <li
                  key={subgroup.key}
                  className="overflow-hidden rounded-lg bg-zinc-50 ring-1 ring-zinc-200/70"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => props.onToggleSub(subgroup.key)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-zinc-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {subgroup.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {subgroup.products.length} поз.
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
                    <ProductTable
                      products={subgroup.products}
                      categories={props.categories}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <ProductTable
            products={props.group.products}
            categories={props.categories}
          />
        )
      ) : null}
    </li>
  );
}

function ProductTable(props: {
  products: ProductAdmin[];
  categories: CategoryOptionPublic[];
}) {
  return (
    <div className="overflow-x-auto border-t border-zinc-100">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-t border-zinc-100 text-xs text-zinc-500">
            <th className="px-4 py-2 font-medium">Товар</th>
            <th className="w-28 px-3 py-2 font-medium">Количество</th>
            <th className="w-28 px-3 py-2 font-medium">
              <span className="sr-only">Удалить</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {props.products.map((product) => (
            <tr key={product.id} className="border-t border-zinc-100 first:border-t-0">
              <td className="px-4 py-3 align-top">
                <div className="flex gap-3">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200/80"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80">
                      ▦
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{product.name}</p>
                    {product.categoryName ? (
                      <p className="text-sm text-zinc-600">
                        {product.categoryName}
                        {product.subcategoryName
                          ? ` · ${product.subcategoryName}`
                          : ""}
                      </p>
                    ) : null}
                    <p className="text-sm text-zinc-600">
                      {formatPriceSomLabel(product.priceCents)} · себест.{" "}
                      {formatPriceSomLabel(product.costCents)}
                    </p>
                    {product.description ? (
                      <p className="mt-1 text-sm text-zinc-600">
                        {product.description}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <ProductForm
                        categories={props.categories}
                        product={product}
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td className="w-28 px-3 py-3 align-top">
                <StockAdjust
                  productId={product.id}
                  initialStock={product.stockQuantity}
                  hideLabel
                />
              </td>
              <td className="w-28 px-3 py-3 align-top">
                <ProductDeleteButton
                  productId={product.id}
                  productName={product.name}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        props.active
          ? "rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-full bg-white px-3 py-1.5 text-sm text-zinc-600 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50"
      }
    >
      {props.label}
    </button>
  );
}
