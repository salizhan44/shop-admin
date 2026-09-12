"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  chartScrollAfterZoom,
  formatReportDay,
  formatReportDayShort,
  nextChartZoom,
  type DailySalesRow,
} from "@/lib/analytics.shared";
import { formatPriceSomLabel, formatSignedSomLabel } from "@/lib/products.shared";

const HEIGHT = 280;
const PAD = { top: 20, right: 16, bottom: 32, left: 56 };

export function SalesChart(props: { days: DailySalesRow[] }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const pendingScrollRef = useRef<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const days = props.days;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    function measure() {
      const node = viewportRef.current;
      if (!node) {
        return;
      }
      const next = Math.floor(node.getBoundingClientRect().width);
      if (next > 0) {
        setViewportWidth(next);
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const plotWidth = useMemo(() => {
    if (viewportWidth <= 0) {
      return 0;
    }
    const inner = Math.max(1, viewportWidth - PAD.left - PAD.right);
    return PAD.left + PAD.right + inner * zoom;
  }, [viewportWidth, zoom]);

  const geometry = useMemo(() => {
    const innerWidth = Math.max(1, plotWidth - PAD.left - PAD.right);
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const maxValue = Math.max(
      1,
      ...days.map((day) => Math.max(day.revenueCents, day.profitCents, 0)),
    );
    const step = days.length > 1 ? innerWidth / (days.length - 1) : innerWidth;

    function xAt(index: number): number {
      return PAD.left + index * step;
    }

    function yAt(cents: number): number {
      return PAD.top + innerHeight - (cents / maxValue) * innerHeight;
    }

    function toPath(values: number[]): string {
      return values
        .map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`)
        .join(" ");
    }

    const revenuePath = toPath(days.map((day) => day.revenueCents));
    const profitPath = toPath(days.map((day) => Math.max(0, day.profitCents)));
    const lastX = xAt(Math.max(0, days.length - 1));
    const areaPath = `${revenuePath} L ${lastX} ${PAD.top + innerHeight} L ${xAt(0)} ${PAD.top + innerHeight} Z`;

    return { innerHeight, maxValue, step, xAt, yAt, revenuePath, profitPath, areaPath };
  }, [days, plotWidth]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || pendingScrollRef.current === null) {
      return;
    }
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = Math.min(maxScroll, pendingScrollRef.current);
    pendingScrollRef.current = null;
  }, [plotWidth]);

  useEffect(() => {
    function onWheel(event: WheelEvent) {
      const frame = frameRef.current;
      const viewport = viewportRef.current;
      const target = event.target;
      if (!frame || !viewport || !(target instanceof Node) || !frame.contains(target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        viewport.scrollLeft += event.deltaX;
        return;
      }
      const oldZoom = zoomRef.current;
      const newZoom = nextChartZoom(oldZoom, event.deltaY);
      if (newZoom === oldZoom) {
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const cursorOffsetX = event.clientX - rect.left;
      const contentX = viewport.scrollLeft + cursorOffsetX;
      pendingScrollRef.current = chartScrollAfterZoom({
        contentX,
        cursorOffsetX,
        oldZoom,
        newZoom,
        padLeft: PAD.left,
      });
      zoomRef.current = newZoom;
      setZoom(newZoom);
    }

    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      document.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, []);

  if (days.length === 0) {
    return (
      <p className="text-sm text-zinc-600">Нет данных за выбранный период.</p>
    );
  }

  const active = hoverIndex === null ? null : days[hoverIndex];
  const labelEvery = Math.max(
    1,
    Math.ceil(days.length / Math.max(6, Math.floor(plotWidth / 90))),
  );

  function onMove(clientX: number) {
    const viewport = viewportRef.current;
    if (!viewport || plotWidth <= 0 || geometry.step <= 0) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const x = viewport.scrollLeft + (clientX - rect.left);
    const index = Math.round((x - PAD.left) / geometry.step);
    const clamped = Math.min(days.length - 1, Math.max(0, index));
    setHoverIndex(clamped);
  }

  return (
    <div
      ref={frameRef}
      className="flex h-full w-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 overscroll-contain sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-blue-500" />
            Выручка
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-teal-600" />
            Прибыль
          </span>
        </div>
        {active ? (
          <p className="text-sm text-zinc-800">
            <span className="font-medium">{formatReportDay(active.date)}</span>
            {" · "}
            {formatPriceSomLabel(active.revenueCents)} выручка
            {" · "}
            {formatSignedSomLabel(active.profitCents)} прибыль
            {" · "}
            {active.orderCount} зак.
          </p>
        ) : (
          <p className="text-sm text-zinc-400">Наведите на день</p>
        )}
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          className="w-full overflow-x-scroll overflow-y-hidden overscroll-x-contain [scrollbar-gutter:stable] [scrollbar-width:auto] [scrollbar-color:#a1a1aa_#f4f4f5] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500"
        >
          {plotWidth > 0 ? (
            <svg
              width={plotWidth}
              height={HEIGHT}
              viewBox={`0 0 ${plotWidth} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="block"
              role="img"
              aria-label="Выручка и прибыль по дням"
              onPointerLeave={() => setHoverIndex(null)}
              onPointerMove={(event) => onMove(event.clientX)}
            >
              <line
                x1={PAD.left}
                x2={plotWidth - PAD.right}
                y1={HEIGHT - PAD.bottom}
                y2={HEIGHT - PAD.bottom}
                className="stroke-zinc-200"
              />
              <path d={geometry.areaPath} className="fill-blue-500/10" />
              <path
                d={geometry.revenuePath}
                fill="none"
                className="stroke-blue-500"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={geometry.profitPath}
                fill="none"
                className="stroke-teal-600"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {days.map((day, index) =>
                index % labelEvery === 0 || index === days.length - 1 ? (
                  <text
                    key={day.date}
                    x={geometry.xAt(index)}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-zinc-400 text-[10px]"
                  >
                    {formatReportDayShort(day.date)}
                  </text>
                ) : null,
              )}
              {active && hoverIndex !== null ? (
                <g>
                  <line
                    x1={geometry.xAt(hoverIndex)}
                    x2={geometry.xAt(hoverIndex)}
                    y1={PAD.top}
                    y2={HEIGHT - PAD.bottom}
                    className="stroke-zinc-300"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={geometry.xAt(hoverIndex)}
                    cy={geometry.yAt(active.revenueCents)}
                    r="4.5"
                    className="fill-blue-500"
                  />
                  <circle
                    cx={geometry.xAt(hoverIndex)}
                    cy={geometry.yAt(Math.max(0, active.profitCents))}
                    r="4.5"
                    className="fill-teal-600"
                  />
                </g>
              ) : null}
            </svg>
          ) : (
            <div className="h-[280px]" />
          )}
        </div>
        <div className="pointer-events-none absolute left-0 top-0 h-[280px] w-14 bg-gradient-to-r from-white from-60% to-transparent">
          <span className="absolute left-1 top-4 text-[10px] text-zinc-400">
            {formatPriceSomLabel(geometry.maxValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
