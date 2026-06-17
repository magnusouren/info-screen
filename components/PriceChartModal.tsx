"use client";

import { useEffect, useMemo, useState } from "react";
import { XIcon as X, LightningIcon as Lightning } from "@phosphor-icons/react";
import type { PricesData, HourlyPrice } from "@/lib/types/prices";

const W = 400;
const H = 200;
const padL = 36;
const padR = 8;
const padT = 12;
const padB = 22;
const plotW = W - padL - padR;
const plotH = H - padT - padB;
const barW = plotW / 24;
const barGap = 2;
const innerW = Math.max(barW - barGap, 1);

function barClass(i: number, selected: number | null, currentHour: number | null) {
  if (i === selected) return "fill-highlight";
  if (i === currentHour) return "fill-text-3";
  return "fill-text-4";
}

function PriceChart({
  prices,
  currentHour,
}: {
  prices: HourlyPrice[];
  currentHour: number | null;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const values = useMemo(
    () => prices.map((p) => Math.round(p.NOK_per_kWh * 100)),
    [prices]
  );
  const peak = Math.max(...values, 5);
  const yMax = Math.max(5, Math.ceil(peak / 5) * 5);

  const yTicks = [0, Math.round(yMax / 2), yMax];
  const xTicks = [0, 6, 12, 18];

  const handlePointerEnter = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setSelected(i);
  };
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setSelected(null);
  };
  const handleClick = (i: number) => () => {
    setSelected((prev) => (prev === i ? null : i));
  };

  const tooltip = selected !== null ? (() => {
    const price = values[selected];
    const h = (price / yMax) * plotH;
    const barTopY = padT + plotH - h;
    const barCenterX = padL + selected * barW + barW / 2;
    const isNow = selected === currentHour;
    const hourLabel = `Kl. ${String(selected).padStart(2, "0")}–${String(
      (selected + 1) % 24
    ).padStart(2, "0")}`;
    return {
      leftPct: (barCenterX / W) * 100,
      topPct: (barTopY / H) * 100,
      price,
      hourLabel,
      isNow,
    };
  })() : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
        {yTicks.map((v) => {
          const y = padT + plotH - (v / yMax) * plotH;
          return (
            <g key={v}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                className="stroke-border"
                strokeWidth="0.5"
              />
              <text
                x={padL - 6}
                y={y + 3}
                className="fill-text-3"
                fontSize="9"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          );
        })}

        {prices.map((_, i) => {
          const v = values[i];
          const h = (v / yMax) * plotH;
          const x = padL + i * barW + barGap / 2;
          const y = padT + plotH - h;
          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={innerW}
              height={Math.max(h, 1)}
              rx="1"
              className={`${barClass(i, selected, currentHour)} transition-colors`}
            />
          );
        })}

        {prices.map((_, i) => {
          const x = padL + i * barW;
          return (
            <rect
              key={`hit-${i}`}
              x={x}
              y={padT}
              width={barW}
              height={plotH}
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={handlePointerEnter(i)}
              onPointerLeave={handlePointerLeave}
              onClick={handleClick(i)}
            />
          );
        })}

        {xTicks.map((h) => {
          const x = padL + h * barW + barW / 2;
          return (
            <text
              key={h}
              x={x}
              y={H - 6}
              className="fill-text-3"
              fontSize="9"
              textAnchor="middle"
            >
              {String(h).padStart(2, "0")}
            </text>
          );
        })}

        <text
          x={padL - 6}
          y={padT - 2}
          className="fill-text-4"
          fontSize="8"
          textAnchor="end"
        >
          øre
        </text>
        <text
          x={W - padR}
          y={H - 6}
          className="fill-text-4"
          fontSize="8"
          textAnchor="end"
        >
          time
        </text>
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: `${tooltip.leftPct}%`, top: `${tooltip.topPct}%` }}
        >
          <div className="relative bg-bg border border-border-strong rounded-md px-3 py-2 shadow-xl whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-text-3 text-[10px] uppercase tracking-widest">
                {tooltip.hourLabel}
              </span>
              {tooltip.isNow && (
                <span className="text-[9px] uppercase tracking-widest text-text-2 bg-surface-2 rounded px-1 py-0.5">
                  Nå
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-text text-xl font-thin tabular-nums">
                {tooltip.price}
              </span>
              <span className="text-text-3 text-[10px]">øre/kWh</span>
            </div>
            <div
              className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2 h-2 rotate-45 bg-bg border-r border-b border-border-strong"
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PriceChartModal({
  data,
  priceArea,
  onClose,
}: {
  data: PricesData;
  priceArea: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currentHour = new Date().getHours();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-1 text-text-3 text-xs font-light">
              <Lightning size={11} weight="light" />
              <span>Strømpris · {priceArea}</span>
            </div>
            <div className="text-text-2 text-sm font-light mt-0.5">
              Timespriser
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-2 transition-colors -mr-1 -mt-1 p-1"
            aria-label="Lukk"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          <div>
            <div className="text-text-3 text-xs uppercase tracking-widest mb-2">
              I dag
            </div>
            <PriceChart prices={data.today} currentHour={currentHour} />
          </div>

          {data.tomorrow && (
            <div>
              <div className="text-text-3 text-xs uppercase tracking-widest mb-2">
                I morgen
              </div>
              <PriceChart prices={data.tomorrow} currentHour={null} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
