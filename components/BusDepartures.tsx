"use client";

import { useEffect, useState } from "react";
import { Bus } from "@phosphor-icons/react";
import type { BusData } from "@/lib/types/bus";
import BusStopModal from "./BusStopModal";

export default function BusDepartures() {
  const [data, setData] = useState<BusData | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [openStop, setOpenStop] = useState<{ id: string; name: string } | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/bus");
        if (!res.ok) throw new Error();
        setData(await res.json());
        setUpdatedAt(
          new Date().toLocaleTimeString("no-NO", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Oslo",
          })
        );
        setError(false);
      } catch {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
          <Bus size={13} weight="light" />
          Buss
        </div>
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Avganger utilgjengelig" : "Laster avganger…"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.map((stop) => (
          <button
            key={stop.stopId}
            type="button"
            onClick={() =>
              setOpenStop({ id: stop.stopId, name: stop.stopName })
            }
            className="text-left w-full rounded-lg -mx-2 px-2 py-1 cursor-pointer hover:bg-surface/40 transition-colors"
            aria-label={`Vis alle avganger for ${stop.stopName}`}
          >
            <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
              <Bus size={13} weight="light" />
              {stop.stopName}
            </div>
            <div className="space-y-2">
              {stop.departures.map((dep, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-center text-xs font-medium text-text-2 bg-surface-2 rounded px-1 py-0.5 tabular-nums shrink-0">
                    {dep.line}
                  </span>
                  <span className="text-text-2 flex-1 truncate font-light">
                    {dep.destination}
                  </span>
                  <span className="text-text-3 tabular-nums text-xs shrink-0">
                    {dep.expectedTime}
                  </span>
                  <span className="tabular-nums text-xs w-12 text-right shrink-0 text-text-3">
                    {dep.minutesUntil <= 0 ? "nå" : `${dep.minutesUntil} min`}
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
        {updatedAt && (
          <div className="text-text-5 text-[10px] font-light tracking-wider pt-1">
            Oppdatert: {updatedAt}
          </div>
        )}
      </div>
      {openStop && (
        <BusStopModal
          stopId={openStop.id}
          stopName={openStop.name}
          onClose={() => setOpenStop(null)}
        />
      )}
    </>
  );
}
