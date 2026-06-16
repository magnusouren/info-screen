"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Lightning } from "@phosphor-icons/react";
import type { PricesData, HourlyPrice } from "@/lib/types/prices";

function buildChartData(prices: HourlyPrice[], cheapCount = 4) {
  const sorted = [...prices].sort((a, b) => a.NOK_per_kWh - b.NOK_per_kWh);
  const cheapThreshold = sorted[cheapCount - 1]?.NOK_per_kWh ?? 0;
  return prices.map((p) => ({
    hour: new Date(p.time_start).toLocaleTimeString("no-NO", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo",
    }),
    price: Math.round(p.NOK_per_kWh * 100),
    cheap: p.NOK_per_kWh <= cheapThreshold,
  }));
}

interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string; }
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300">
      <div className="font-medium">{label}</div>
      <div>{payload[0].value} øre/kWh</div>
    </div>
  );
}

function PriceChart({ prices, label }: { prices: HourlyPrice[]; label: string }) {
  const data = buildChartData(prices);
  const currentHour = new Date().getHours();
  return (
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="hour" tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="price" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={index === currentHour && label === "I dag" ? "#a1a1aa" : entry.cheap ? "#4a5568" : "#27272a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ElectricityPrice() {
  const [data, setData] = useState<PricesData | null>(null);
  const [error, setError] = useState(false);

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
    ? Math.round((data.today[new Date().getHours()]?.NOK_per_kWh ?? 0) * 100)
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
          <Lightning size={13} weight="light" />
          Strøm
        </div>
        {currentPrice !== null && (
          <div className="text-zinc-300 text-sm tabular-nums">
            {currentPrice} <span className="text-zinc-600 text-xs">øre/kWh nå</span>
          </div>
        )}
      </div>
      {!data ? (
        <div className="text-zinc-700 text-sm animate-pulse">
          {error ? "Strømpris utilgjengelig" : "Laster priser…"}
        </div>
      ) : (
        <div className="space-y-3">
          <PriceChart prices={data.today} label="I dag" />
          {data.tomorrow && <PriceChart prices={data.tomorrow} label="I morgen" />}
        </div>
      )}
    </div>
  );
}
