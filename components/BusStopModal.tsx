"use client";

import { useEffect, useState } from "react";
import { XIcon as X, BusIcon as Bus } from "@phosphor-icons/react";
import type { StopDepartures } from "@/lib/types/bus";

export default function BusStopModal({
  stopId,
  stopName,
  onClose,
}: {
  stopId: string;
  stopName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StopDepartures | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/bus/${encodeURIComponent(stopId)}?count=20`
        );
        if (!res.ok) throw new Error();
        const json = (await res.json()) as StopDepartures;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 30 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stopId]);

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
            <div className="flex items-center gap-1 text-text-3  font-light">
              <Bus size={20} weight="light" />
              <span>{data?.stopName ?? stopName}</span>
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

        <div className="overflow-y-auto flex-1">
          {!data ? (
            <div className="text-text-5 text-sm animate-pulse p-5">
              {error ? "Avganger utilgjengelig" : "Laster avganger…"}
            </div>
          ) : data.departures.length === 0 ? (
            <div className="text-text-4 text-sm p-5">Ingen avganger</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.departures.map((dep, i) => (
                <li
                  key={`${dep.line}-${dep.expectedTime}-${i}`}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="w-10 text-center text-xs font-medium text-text-2 bg-surface-2 rounded px-1 py-1 tabular-nums shrink-0">
                    {dep.line}
                  </span>
                  <span className="text-text-2 flex-1 truncate font-light">
                    {dep.destination}
                  </span>
                  <span className="text-text-3 text-xs tabular-nums shrink-0">
                    {dep.expectedTime}
                  </span>
                  <span className="text-text-3 text-sm tabular-nums w-16 text-right shrink-0">
                    {dep.minutesUntil <= 0 ? "nå" : `${dep.minutesUntil} min`}
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
