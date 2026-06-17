"use client";

import { useEffect, useState } from "react";
import {
  WindIcon as Wind,
  DropIcon as Drop,
  MapPinIcon as MapPin,
} from "@phosphor-icons/react";
import WeatherIcon from "./WeatherIcon";
import WeatherDetailsModal from "./WeatherDetailsModal";
import type { WeatherData } from "@/lib/types/weather";
import { getCoords, type Coords } from "@/lib/geolocation";

function PrecipitationBar({ data }: { data: WeatherData["precipitation"] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.amount), 0);
  if (max === 0) {
    return (
      <div className="mt-3 text-text-4 text-xs font-light">
        Det er ikke ventet regn i dag
      </div>
    );
  }
  return (
    <div className="mt-3">
      <div className="flex items-end gap-0.5 h-8">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-text-3 rounded-sm"
              style={{
                height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 15 : 3)}%`,
                opacity: d.amount > 0 ? 1 : 0.2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-1 gap-0.5">
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <div key={i} className="text-text-4 text-[9px] leading-none flex-1 text-center">{d.hour}</div>
          ) : (
            <div key={i} className="flex-1" />
          )
        )}
      </div>
    </div>
  );
}

export default function Weather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async (coords: Coords) => {
      const qs = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : "";
      try {
        const res = await fetch(`/api/weather${qs}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as WeatherData;
        if (cancelled) return;
        setData(json);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    };

    let coords: Coords = null;
    getCoords().then((c) => {
      if (cancelled) return;
      coords = c;
      load(coords);
    });

    const id = setInterval(() => load(coords), 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) return (
    <div className="text-text-5 text-sm animate-pulse">
      {error ? "Værdata utilgjengelig" : "Laster vær…"}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left cursor-pointer rounded-lg -mx-2 -my-1 px-2 py-1 hover:bg-surface/40 transition-colors"
        aria-label="Vis værdetaljer"
      >
        <div className="flex items-center gap-1 text-text-3 text-xs font-light">
          <MapPin size={11} weight="light" />
          <span>{data.locationName}</span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <WeatherIcon symbolCode={data.symbolCode} size={44} className="text-text-2" />
          <span className="text-5xl font-thin text-text tabular-nums">{data.temperature}°</span>
        </div>
        <div className="mt-1 flex gap-4 text-text-3 text-sm font-light items-center">
          <span className="flex items-center gap-1"><Wind size={13} weight="light" />{data.windSpeed} m/s</span>
          <span className="flex items-center gap-1"><Drop size={13} weight="light" />{data.humidity}%</span>
        </div>
        <PrecipitationBar data={data.precipitation} />
      </button>
      {open && <WeatherDetailsModal data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
