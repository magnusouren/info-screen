"use client";

import { useEffect, useState } from "react";
import { SunHorizon } from "@phosphor-icons/react";
import type { SunriseData } from "@/lib/types/sunrise";

export default function Sunrise() {
  const [data, setData] = useState<SunriseData | null>(null);

  useEffect(() => {
    fetch("/api/sunrise")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
    const id = setInterval(() => {
      fetch("/api/sunrise").then((r) => r.json()).then(setData).catch(() => {});
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  return (
    <div className="flex gap-4 text-zinc-500 text-sm font-light items-center">
      <span className="flex items-center gap-1">
        <SunHorizon size={14} weight="light" />{data.sunrise}
      </span>
      <span className="flex items-center gap-1 opacity-60">
        <SunHorizon size={14} weight="light" className="rotate-180" />{data.sunset}
      </span>
    </div>
  );
}
