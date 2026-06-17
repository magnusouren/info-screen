"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BusIcon as Bus } from "@phosphor-icons/react";
import type { BusData } from "@/lib/types/bus";
import BusStopModal from "./BusStopModal";
import BusSettingsModal from "./BusSettingsModal";
import {
  getStops,
  getServerStops,
  subscribe,
  type SavedStop,
} from "@/lib/bus-stops";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;

function stopsToParam(stops: SavedStop[]): string {
  return stops.map((s) => `${s.stopId}:${s.maxDepartures}`).join(",");
}

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function useLongPress(
  onTap: () => void,
  onLongPress: () => void
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onPointerDown: (e) => {
      firedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e) => {
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD) {
        clear();
      }
    },
    onPointerUp: () => {
      const fired = firedRef.current;
      clear();
      startRef.current = null;
      if (!fired) onTap();
    },
    onPointerCancel: () => {
      clear();
      startRef.current = null;
    },
    onContextMenu: (e) => {
      e.preventDefault();
    },
  };
}

function BusStopButton({
  stop,
  onTap,
  onLongPress,
  children,
}: {
  stop: { stopId: string; stopName: string };
  onTap: (s: { stopId: string; stopName: string }) => void;
  onLongPress: () => void;
  children: React.ReactNode;
}) {
  const handlers = useLongPress(
    () => onTap(stop),
    onLongPress
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className="text-left w-full rounded-lg -mx-2 px-2 py-1 cursor-pointer hover:bg-surface/40 transition-colors select-none"
      aria-label={`Vis alle avganger for ${stop.stopName}. Hold inne for innstillinger.`}
      {...handlers}
    >
      {children}
    </div>
  );
}

export default function BusDepartures() {
  const stops = useSyncExternalStore(subscribe, getStops, getServerStops);
  const [data, setData] = useState<BusData | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [openStop, setOpenStop] = useState<{ id: string; name: string } | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const stopsParam = stopsToParam(stops);
  const empty = stops.length === 0;

  useEffect(() => {
    if (empty) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/bus?stops=${encodeURIComponent(stopsParam)}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as BusData;
        if (cancelled) return;
        setData(json);
        setUpdatedAt(
          new Date().toLocaleTimeString("no-NO", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Oslo",
          })
        );
        setError(false);
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
  }, [stopsParam, empty]);

  if (empty) {
    return (
      <>
        <div>
          <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
            <Bus size={13} weight="light" />
            Buss
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="text-text-5 hover:text-text-2 text-sm font-light underline-offset-2 hover:underline transition-colors"
          >
            Ingen stoppesteder. Trykk for å legge til.
          </button>
        </div>
        {settingsOpen && (
          <BusSettingsModal stops={stops} onClose={() => setSettingsOpen(false)} />
        )}
      </>
    );
  }

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
            <BusStopButton
              key={stop.stopId}
              stop={stop}
              onTap={(s) => setOpenStop({ id: s.stopId, name: s.stopName })}
              onLongPress={() => setSettingsOpen(true)}
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
            </BusStopButton>
          ))}
        {updatedAt && data.length > 0 && (
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
      {settingsOpen && (
        <BusSettingsModal stops={stops} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
