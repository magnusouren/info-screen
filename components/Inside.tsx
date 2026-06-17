"use client";

import { useEffect, useState } from "react";
import {
  HouseIcon as House,
  DropIcon as Drop,
} from "@phosphor-icons/react";
import type { InsideData } from "@/lib/types/inside";

export default function Inside() {
  const [data, setData] = useState<InsideData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/inside");
        if (!res.ok) throw new Error();
        const json = (await res.json()) as InsideData;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="text-text-5 text-sm animate-pulse">
        {error ? "Sensor utilgjengelig" : "Laster…"}
      </div>
    );
  }

  return (
    <div className="px-2 py-1 -mx-2 -my-1">
      <div className="flex items-center gap-1 text-text-3 text-xs font-light">
        <House size={11} weight="light" />
        <span>Inne</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <House size={44} weight="thin" className="text-text-2" />
        <span className="text-5xl font-thin text-text tabular-nums">
          {Math.round(data.temperature)}°
        </span>
      </div>
      <div className="mt-1 flex gap-4 text-text-3 text-sm font-light items-center">
        <span className="flex items-center gap-1">
          <Drop size={13} weight="light" />
          {data.humidity}%
        </span>
      </div>
    </div>
  );
}
