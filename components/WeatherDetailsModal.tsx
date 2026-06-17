"use client";

import { useEffect } from "react";
import {
  WindIcon as Wind,
  DropIcon as Drop,
  XIcon as X,
  MapPinIcon as MapPin,
} from "@phosphor-icons/react";
import WeatherIcon from "./WeatherIcon";
import type { WeatherData } from "@/lib/types/weather";

export default function WeatherDetailsModal({
  data,
  onClose,
}: {
  data: WeatherData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-1 text-text-3 text-xs font-light">
              <MapPin size={11} weight="light" />
              <span>{data.locationName}</span>
            </div>
            <div className="text-text-2 text-sm font-light mt-0.5">
              Neste 24 timer
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

        <div className="overflow-y-auto flex-1 px-1">
          {data.hourly.length === 0 ? (
            <div className="text-text-4 text-sm p-5">Ingen timesdata</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.hourly.map((h) => (
                <li
                  key={h.time}
                  className="grid grid-cols-[3rem_2rem_3rem_1fr_1fr] items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-text-3 text-sm tabular-nums">
                    {h.hour}
                  </span>
                  <WeatherIcon
                    symbolCode={h.symbolCode}
                    size={24}
                    className="text-text-2"
                  />
                  <span className="text-text text-lg font-thin tabular-nums">
                    {h.temperature}°
                  </span>
                  <span className="flex items-center gap-1 text-text-3 text-xs font-light tabular-nums">
                    <Drop size={11} weight="light" />
                    {h.precipitation > 0 ? `${h.precipitation.toFixed(1)} mm` : "–"}
                  </span>
                  <span className="flex items-center gap-1 text-text-3 text-xs font-light tabular-nums">
                    <Wind size={11} weight="light" />
                    {h.windSpeed} m/s
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
