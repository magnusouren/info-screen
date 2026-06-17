"use client";

import { useEffect, useState } from "react";
import {
  XIcon as X,
  GlobeHemisphereWestIcon as GlobeHemisphereWest,
} from "@phosphor-icons/react";

const ZONES: { city: string; tz: string }[] = [
  { city: "Los Angeles", tz: "America/Los_Angeles" },
  { city: "New York", tz: "America/New_York" },
  { city: "São Paulo", tz: "America/Sao_Paulo" },
  { city: "London", tz: "Europe/London" },
  { city: "Oslo", tz: "Europe/Oslo" },
  { city: "Dubai", tz: "Asia/Dubai" },
  { city: "Mumbai", tz: "Asia/Kolkata" },
  { city: "Singapore", tz: "Asia/Singapore" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
  { city: "Sydney", tz: "Australia/Sydney" },
];

function tzOffsetMinutes(tz: string, now: Date): number {
  const localStr = now.toLocaleString("en-US", { timeZone: tz });
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  return (new Date(localStr).getTime() - new Date(utcStr).getTime()) / 60000;
}

function tzDayOfYear(tz: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return Date.UTC(y, m - 1, d) / 86400000;
}

function relativeDayLabel(tz: string, oslo: number, now: Date): string | null {
  const day = tzDayOfYear(tz, now);
  if (day === oslo) return null;
  if (day === oslo - 1) return "I går";
  if (day === oslo + 1) return "I morgen";
  return null;
}

export default function WorldClockModal({ onClose }: { onClose: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const oslo = tzDayOfYear("Europe/Oslo", now);
  const sorted = [...ZONES].sort(
    (a, b) => tzOffsetMinutes(a.tz, now) - tzOffsetMinutes(b.tz, now)
  );

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
              <GlobeHemisphereWest size={11} weight="light" />
              <span>Verdensklokke</span>
            </div>
            <div className="text-text-2 text-sm font-light mt-0.5">
              Tid rundt om i verden
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

        <ul className="overflow-y-auto flex-1 divide-y divide-border/60">
          {sorted.map(({ city, tz }) => {
            const time = now.toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: tz,
            });
            const weekday = now.toLocaleDateString("no-NO", {
              weekday: "long",
              timeZone: tz,
            });
            const relLabel = relativeDayLabel(tz, oslo, now);
            const isOslo = tz === "Europe/Oslo";
            return (
              <li
                key={tz}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <div
                    className={`text-sm font-light ${
                      isOslo ? "text-text" : "text-text-2"
                    }`}
                  >
                    {city}
                  </div>
                  <div className="text-text-4 text-xs font-light mt-0.5 capitalize">
                    {weekday}
                    {relLabel ? ` · ${relLabel}` : ""}
                  </div>
                </div>
                <div
                  className={`text-2xl font-thin tabular-nums ${
                    isOslo ? "text-text" : "text-text-2"
                  }`}
                >
                  {time}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
