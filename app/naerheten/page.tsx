"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowsClockwiseIcon as Refresh,
  BicycleIcon as Bicycle,
  BusIcon as Bus,
  LightningIcon as Lightning,
  MapPinIcon as MapPin,
} from "@phosphor-icons/react";
import { getCoords, type Coords } from "@/lib/geolocation";
import { hexToRgba } from "@/lib/colorUtils";
import type { NearbyStopDepartures } from "@/lib/types/bus";
import type { CityBikeStation } from "@/lib/types/citybike";

const POLL_MS = 30 * 1000;
const BIKE_LIMIT = 3;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function iconsForType(id: string) {
  return id === "ebike" ? [Lightning, Bicycle] : [Bicycle];
}

export default function NearbyPage() {
  const [coords, setCoords] = useState<Coords>(null);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const [stops, setStops] = useState<NearbyStopDepartures[] | null>(null);
  const [stopsError, setStopsError] = useState(false);
  const [stations, setStations] = useState<CityBikeStation[] | null>(null);
  const [stationsError, setStationsError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCoords().then((c) => {
      if (cancelled) return;
      setCoords(c);
      setCoordsResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAll = useCallback(async (coordsValue: Coords) => {
    const params = new URLSearchParams();
    if (coordsValue) {
      params.set("lat", String(coordsValue.lat));
      params.set("lon", String(coordsValue.lon));
    }
    const bikeParams = new URLSearchParams(params);
    bikeParams.set("limit", String(BIKE_LIMIT));

    const [stopsRes, bikeRes] = await Promise.allSettled([
      fetch(`/api/bus/nearby?${params}`),
      fetch(`/api/citybike?${bikeParams}`),
    ]);

    if (stopsRes.status === "fulfilled" && stopsRes.value.ok) {
      setStops((await stopsRes.value.json()) as NearbyStopDepartures[]);
      setStopsError(false);
    } else {
      setStopsError(true);
    }

    if (bikeRes.status === "fulfilled" && bikeRes.value.ok) {
      setStations((await bikeRes.value.json()) as CityBikeStation[]);
      setStationsError(false);
    } else {
      setStationsError(true);
    }

    setUpdatedAt(
      new Date().toLocaleTimeString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
      })
    );
  }, []);

  useEffect(() => {
    if (!coordsResolved) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) fetchAll(coords);
    };
    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordsResolved]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAll(coords);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-6 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-light text-text">I nærheten</h1>
          <div className="flex items-center gap-1.5 text-xs text-text-4 mt-1">
            <MapPin size={12} weight="light" />
            {!coordsResolved
              ? "Henter posisjon…"
              : coords
                ? "Bruker enhetens posisjon"
                : "Posisjon utilgjengelig — viser Sofienberg"}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || !coordsResolved}
          aria-label="Oppdater"
          className="rounded-lg border border-border p-2 text-text-3 hover:text-text-2 hover:bg-surface/40 transition-colors disabled:opacity-40"
        >
          <Refresh
            size={18}
            weight="light"
            className={refreshing ? "animate-spin" : undefined}
          />
        </button>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
          <Bus size={13} weight="light" />
          Stoppesteder
        </div>
        {!coordsResolved || stops === null ? (
          <div className="text-text-5 text-sm animate-pulse">
            {stopsError ? "Avganger utilgjengelig" : "Laster stoppesteder…"}
          </div>
        ) : stops.length === 0 ? (
          <div className="text-text-5 text-sm">Ingen stoppesteder i nærheten</div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop) => (
              <div
                key={stop.stopId}
                className="rounded-xl border border-border bg-surface/40 p-4"
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <div className="text-sm text-text-2 font-light truncate">
                    {stop.stopName}
                  </div>
                  <div className="text-xs text-text-4 tabular-nums shrink-0">
                    {formatDistance(stop.distanceMeters)}
                  </div>
                </div>
                <div className="space-y-2">
                  {stop.departures.map((dep, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span
                        className="w-8 text-center text-xs font-medium text-text-2 bg-surface-2 rounded px-1 py-0.5 tabular-nums shrink-0"
                        style={
                          dep.color
                            ? {
                                backgroundColor: hexToRgba(dep.color, 0.4),
                                color: dep.color,
                              }
                            : undefined
                        }
                      >
                        {dep.line}
                      </span>
                      <span className="text-text-2 flex-1 truncate font-light">
                        {dep.destination}
                      </span>
                      <span className="tabular-nums text-xs w-12 text-right shrink-0 text-text-3">
                        {dep.minutesUntil <= 0
                          ? "nå"
                          : dep.minutesUntil > 10
                            ? dep.expectedTime
                            : `${dep.minutesUntil} min`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
          <Bicycle size={13} weight="light" />
          Bysykkel
        </div>
        {!coordsResolved || stations === null ? (
          <div className="text-text-5 text-sm animate-pulse">
            {stationsError ? "Bysykkeldata utilgjengelig" : "Laster bysykkelstasjoner…"}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-text-5 text-sm">Ingen bysykkelstasjoner i nærheten</div>
        ) : (
          <div className="space-y-3">
            {stations.map((station) => (
              <div
                key={station.stationId}
                className="rounded-xl border border-border bg-surface/40 p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm text-text-2 font-light truncate">
                    {station.name}
                  </div>
                  <div className="text-xs text-text-4 tabular-nums mt-0.5">
                    {formatDistance(station.distanceMeters)}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {station.vehicleTypes.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-1 text-text-2"
                      title={v.name}
                    >
                      {iconsForType(v.id).map((Icon, i) => (
                        <Icon key={i} size={14} weight="light" />
                      ))}
                      <span className="font-light tabular-nums text-sm">
                        {v.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {updatedAt && (
        <div className="text-text-5 text-[10px] font-light tracking-wider pt-6">
          Oppdatert: {updatedAt}
        </div>
      )}
    </main>
  );
}
