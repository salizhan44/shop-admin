"use client";

import { useState } from "react";
import {
  categoryChartColor,
  formatCategorySalesPercent,
  type CategorySalesShare,
} from "@/lib/analytics.shared";
import { UI_MUTED_CLASS } from "@/lib/ui.shared";

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER = 92;
const INNER = 58;

function polar(radius: number, angle: number): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function donutSlicePath(startAngle: number, endAngle: number): string {
  const sweep = endAngle - startAngle;
  if (sweep >= 359.999) {
    const outerA = polar(OUTER, 0);
    const outerB = polar(OUTER, 180);
    const innerA = polar(INNER, 0);
    const innerB = polar(INNER, 180);
    return [
      `M ${outerA.x} ${outerA.y}`,
      `A ${OUTER} ${OUTER} 0 1 1 ${outerB.x} ${outerB.y}`,
      `A ${OUTER} ${OUTER} 0 1 1 ${outerA.x} ${outerA.y}`,
      `M ${innerA.x} ${innerA.y}`,
      `A ${INNER} ${INNER} 0 1 0 ${innerB.x} ${innerB.y}`,
      `A ${INNER} ${INNER} 0 1 0 ${innerA.x} ${innerA.y}`,
    ].join(" ");
  }
  const outerStart = polar(OUTER, startAngle);
  const outerEnd = polar(OUTER, endAngle);
  const innerEnd = polar(INNER, endAngle);
  const innerStart = polar(INNER, startAngle);
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function CategorySalesChart(props: { shares: CategorySalesShare[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const shares = props.shares;
  const active =
    shares.find((share) => share.categoryId === activeId) ?? shares[0] ?? null;

  if (shares.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] items-center justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 sm:p-5">
        <p className={UI_MUTED_CLASS}>Нет продаж по категориям</p>
      </div>
    );
  }

  let angle = 0;
  const slices = shares.map((share, index) => {
    const startAngle = angle;
    const sweep = (share.percent / 100) * 360;
    angle += sweep;
    return {
      share,
      color: categoryChartColor(index),
      startAngle,
      endAngle: angle,
      path: donutSlicePath(startAngle, angle),
    };
  });

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 sm:p-5">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block"
          role="img"
          aria-label="Доля продаж по категориям"
        >
          {slices.map((slice) => (
            <path
              key={slice.share.categoryId}
              d={slice.path}
              fill={slice.color}
              fillRule="evenodd"
              opacity={
                active && active.categoryId !== slice.share.categoryId ? 0.45 : 1
              }
              className="cursor-pointer transition-opacity"
              onPointerEnter={() => setActiveId(slice.share.categoryId)}
              onPointerLeave={() => setActiveId(null)}
            />
          ))}
          {active ? (
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              className="fill-zinc-900 text-xl font-semibold"
            >
              {formatCategorySalesPercent(active.percent)}
            </text>
          ) : null}
          {active ? (
            <text
              x={CX}
              y={CY + 16}
              textAnchor="middle"
              className="fill-zinc-500 text-[11px]"
            >
              {active.categoryName}
            </text>
          ) : null}
        </svg>
        <ul className="flex w-full flex-col gap-2">
          {slices.map((slice) => (
            <li key={slice.share.categoryId}>
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left text-sm text-zinc-700"
                onPointerEnter={() => setActiveId(slice.share.categoryId)}
                onPointerLeave={() => setActiveId(null)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">
                  {slice.share.categoryName}
                </span>
                <span className="shrink-0 font-medium text-zinc-900">
                  {formatCategorySalesPercent(slice.share.percent)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
