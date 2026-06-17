"use client";

import { useEffect, useState } from "react";
import {
  LightningIcon as Lightning,
  TrendDownIcon as TrendDown,
  TrendUpIcon as TrendUp,
  EqualsIcon as Equals,
  LightbulbIcon as Lightbulb,
} from "@phosphor-icons/react";
import type { PricesData, HourlyPrice } from "@/lib/types/prices";
import { config } from "@/lib/config";
import PriceChartModal from "./PriceChartModal";

const oslo = (iso: string) =>
  new Date(iso).toLocaleTimeString("no-NO", {
    hour: "2-digit",
    timeZone: "Europe/Oslo",
  });

const toOre = (nok: number) => Math.round(nok * 100);

function summarize(prices: HourlyPrice[]) {
  let min = prices[0];
  let max = prices[0];
  let sum = 0;
  for (const p of prices) {
    if (p.NOK_per_kWh < min.NOK_per_kWh) min = p;
    if (p.NOK_per_kWh > max.NOK_per_kWh) max = p;
    sum += p.NOK_per_kWh;
  }
  return {
    avg: toOre(sum / prices.length),
    min: { ore: toOre(min.NOK_per_kWh), hour: oslo(min.time_start) },
    max: { ore: toOre(max.NOK_per_kWh), hour: oslo(max.time_start) },
  };
}

function buildTip(
  today: HourlyPrice[],
  tomorrow: HourlyPrice[] | null,
  now: Date
): { text: string; ore: number } | null {
  const merged = [...today, ...(tomorrow ?? [])];
  const upcoming = merged.filter(
    (p) => new Date(p.time_end).getTime() > now.getTime()
  );
  if (upcoming.length === 0) return null;

  let cheapest = upcoming[0];
  for (const p of upcoming) {
    if (p.NOK_per_kWh < cheapest.NOK_per_kWh) cheapest = p;
  }

  const start = new Date(cheapest.time_start);
  const ore = toOre(cheapest.NOK_per_kWh);
  const hour = oslo(cheapest.time_start);
  const hoursAway = Math.round((start.getTime() - now.getTime()) / 3600000);

  if (hoursAway <= 0) return { text: "Strømmen er billig nå", ore };
  if (hoursAway === 1) return { text: `Billigst om 1 time (kl. ${hour})`, ore };
  if (hoursAway <= 6)
    return { text: `Billigst om ${hoursAway} timer (kl. ${hour})`, ore };

  const sameDay =
    start.toLocaleDateString("no-NO", { timeZone: "Europe/Oslo" }) ===
    now.toLocaleDateString("no-NO", { timeZone: "Europe/Oslo" });
  const dayHint = sameDay ? "" : "i morgen ";
  return { text: `Billigst ${dayHint}kl. ${hour}`, ore };
}

function Stat({
  icon,
  label,
  value,
  hour,
  emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hour?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`flex items-center gap-1 text-[11px] uppercase tracking-wider ${
          emphasis ? "text-text-2" : "text-text-3"
        }`}
      >
        <span className="text-text-4">{icon}</span>
        {label}
      </div>
      <div
        className={`font-thin tabular-nums leading-tight mt-0.5 ${
          emphasis ? "text-text text-3xl" : "text-text-2 text-xl"
        }`}
      >
        {value}
      </div>
      <div className="text-text-4 text-[11px] h-4">
        {hour ? `kl. ${hour}` : ""}
      </div>
    </div>
  );
}

export default function ElectricityPrice() {
  const [data, setData] = useState<PricesData | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) throw new Error();
        setData(await res.json());
        setError(false);
      } catch {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const currentPrice = data?.today
    ? toOre(data.today[new Date().getHours()]?.NOK_per_kWh ?? 0)
    : null;

  const today = data?.today ? summarize(data.today) : null;
  const tip = data?.today ? buildTip(data.today, data.tomorrow, new Date()) : null;

  const clickable = !!data;

  return (
    <>
      <button
        type="button"
        onClick={() => clickable && setOpen(true)}
        disabled={!clickable}
        className="text-left w-full rounded-lg -mx-2 -my-1 px-2 py-1 enabled:cursor-pointer enabled:hover:bg-surface/40 transition-colors"
        aria-label="Vis strømprisgraf"
      >
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
          <Lightning size={13} weight="light" />
          Strøm
        </div>

        {!data ? (
          <div className="text-text-5 text-sm animate-pulse">
            {error ? "Strømpris utilgjengelig" : "Laster priser…"}
          </div>
        ) : (
          <div className="space-y-3">
            {today && (
              <div className="grid grid-cols-4 gap-3 items-end">
                <Stat
                  icon={<Lightning size={12} weight="light" />}
                  label="Nå"
                  value={currentPrice ?? today.avg}
                  emphasis
                />
                <Stat
                  icon={<Equals size={12} weight="light" />}
                  label="Snitt"
                  value={today.avg}
                />
                <Stat
                  icon={<TrendDown size={12} weight="light" />}
                  label="Lavest"
                  value={today.min.ore}
                  hour={today.min.hour}
                />
                <Stat
                  icon={<TrendUp size={12} weight="light" />}
                  label="Høyest"
                  value={today.max.ore}
                  hour={today.max.hour}
                />
              </div>
            )}

            {tip && (
              <div className="flex items-center gap-2 text-accent/80 text-sm font-light">
                <Lightbulb size={14} weight="light" />
                <span>
                  {tip.text}
                  <span className="text-accent/50 text-xs ml-1.5 tabular-nums">
                    {tip.ore} øre
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </button>
      {open && data && (
        <PriceChartModal
          data={data}
          priceArea={config.electricity.priceArea}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
