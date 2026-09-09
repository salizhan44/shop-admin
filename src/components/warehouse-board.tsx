import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard-nav.shared";
import {
  formatPriceSomLabel,
  type WarehouseSnapshot,
} from "@/lib/products.shared";
import { WarehouseCategoryList } from "@/components/warehouse-category-list";

function Stat(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {props.label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-0.5 text-xs text-zinc-500">{props.hint}</p>
      ) : null}
    </div>
  );
}

export function WarehouseBoard(props: { snapshot: WarehouseSnapshot }) {
  const { snapshot } = props;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Позиций"
          value={String(snapshot.productCount)}
          hint="активные товары"
        />
        <Stat
          label="На складе"
          value={`${snapshot.totalUnits} шт.`}
          hint="сумма остатков"
        />
        <Stat
          label="Мало / нет"
          value={`${snapshot.lowStockCount} / ${snapshot.outOfStockCount}`}
          hint={`мало — до ${LOW_STOCK_THRESHOLD} шт.`}
        />
        <Stat
          label="В ценах продажи"
          value={formatPriceSomLabel(snapshot.retailValueCents)}
          hint="остаток × цена"
        />
      </div>
      <WarehouseCategoryList products={snapshot.products} />
    </div>
  );
}
