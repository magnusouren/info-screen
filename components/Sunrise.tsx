"use client";

import { useEffect, useState } from "react";
import { SunHorizonIcon as SunHorizon } from "@phosphor-icons/react";
import type { SunriseData } from "@/lib/types/sunrise";
import { getCoords, type Coords } from "@/lib/geolocation";

export default function Sunrise() {
  const [data, setData] = useState<SunriseData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (coords: Coords) => {
      const qs = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : "";
      try {
        const res = await fetch(`/api/sunrise${qs}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as SunriseData;
        if (!cancelled) setData(json);
      } catch {
        /* ignore — keep previous data */
      }
    };

    let coords: Coords = null;
    getCoords().then((c) => {
      if (cancelled) return;
      coords = c;
      load(coords);
    });

    const id = setInterval(() => load(coords), 24 * 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="flex gap-4 text-text-3 text-sm font-light items-center">
      <span className="flex items-center gap-1">
        <SunHorizon size={14} weight="light" />{data.sunrise}
      </span>
      <span className="flex items-center gap-1 opacity-60">
        <SunHorizon size={14} weight="light" className="rotate-180" />{data.sunset}
      </span>
    </div>
  );
}
