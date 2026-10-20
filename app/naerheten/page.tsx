"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowsClockwiseIcon as Refresh,
  BicycleIcon as Bicycle,
  BoatIcon as Boat,
  BusIcon as Bus,
  LightningIcon as Lightning,
  MagnifyingGlassIcon as MagnifyingGlass,
  MapPinIcon as MapPin,
  PersonSimpleWalkIcon as Walk,
  PlusIcon as Plus,
  TrainIcon as Train,
  XIcon as X,
} from "@phosphor-icons/react";
import { getCoords, type Coords } from "@/lib/geolocation";
import { hexToRgba } from "@/lib/colorUtils";
import {
  addPlace,
  getPlaces,
  getServerPlaces,
  removePlace,
  subscribe as subscribePlaces,
  type SavedPlace,
} from "@/lib/saved-places";
import type { NearbyStopDepartures } from "@/lib/types/bus";
import type { CityBikeStation } from "@/lib/types/citybike";
import type { PlaceSearchResult, TripPattern } from "@/lib/types/trip";

const POLL_MS = 30 * 1000;
const BIKE_LIMIT = 3;
const SEARCH_DEBOUNCE_MS = 300;
const STOPS_FETCH_LIMIT = 8;
const STOPS_PREVIEW_COUNT = 3;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} t` : `${hours} t ${rest} min`;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

function iconsForType(id: string) {
  return id === "ebike" ? [Lightning, Bicycle] : [Bicycle];
}

function modeIcon(mode: string) {
  switch (mode) {
    case "foot":
      return Walk;
    case "bus":
    case "coach":
      return Bus;
    case "tram":
    case "rail":
    case "metro":
      return Train;
    case "water":
      return Boat;
    default:
      return Bus;
  }
}

function PlaceSearch({ onAdd }: { onAdd: (place: SavedPlace) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      if (cancelled) return;
      setSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { results: PlaceSearchResult[] };
        if (!cancelled) setResults(json.results);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const pick = (result: PlaceSearchResult) => {
    onAdd({ id: result.id, name: result.name, lat: result.lat, lon: result.lon });
    setQuery("");
    setResults([]);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2">
        <MagnifyingGlass size={14} weight="light" className="text-text-4 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Legg til sted (adresse eller stoppested)…"
          className="w-full bg-transparent text-sm text-text-2 placeholder:text-text-5 outline-none"
        />
      </div>
      {query.trim().length >= 2 && (
        <div className="mt-2 rounded-lg border border-border bg-surface/40 divide-y divide-border/60 overflow-hidden">
          {searching ? (
            <div className="px-3 py-2 text-text-5 text-sm animate-pulse">Søker…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-text-5 text-sm">Ingen treff</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 text-sm text-text-2 hover:bg-surface/70 transition-colors truncate"
              >
                {r.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TripCard({
  place,
  patterns,
  error,
  onRemove,
}: {
  place: SavedPlace;
  patterns: TripPattern[] | null | undefined;
  error: boolean | undefined;
  onRemove: () => void;
}) {
  const top = patterns?.slice(0, 2) ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <div className="text-sm text-text-2 font-light truncate">{place.name}</div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Fjern ${place.name}`}
          className="text-text-5 hover:text-live transition-colors shrink-0"
        >
          <X size={14} weight="light" />
        </button>
      </div>

      {!patterns ? (
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Reiseforslag utilgjengelig" : "Beregner reise…"}
        </div>
      ) : top.length === 0 ? (
        <div className="text-text-5 text-sm">Ingen reiseforslag funnet</div>
      ) : (
        <div className="space-y-3">
          {top.map((pattern, idx) => (
            <div key={idx} className={idx > 0 ? "pt-3 border-t border-border/60" : undefined}>
              <div className="flex items-center gap-2 text-sm">
                {pattern.legs.map((leg, i) => {
                  const Icon = modeIcon(leg.mode);
                  return (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      {i > 0 && <span className="text-text-5">›</span>}
                      <Icon size={14} weight="light" className="text-text-3" />
                      {leg.line ? (
                        <span
                          className="text-xs font-medium text-text-2 bg-surface-2 rounded px-1 py-0.5 tabular-nums"
                          style={
                            leg.lineColor
                              ? {
                                  backgroundColor: hexToRgba(leg.lineColor, 0.4),
                                  color: leg.lineColor,
                                }
                              : undefined
                          }
                        >
                          {leg.line}
                        </span>
                      ) : leg.mode === "foot" ? (
                        <span className="text-xs text-text-4 tabular-nums">
                          {Math.round(leg.durationSeconds / 60)} min
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-baseline justify-between mt-2 text-xs text-text-4">
                <span>
                  {formatClock(pattern.expectedStartTime)} – {formatClock(pattern.expectedEndTime)}
                </span>
                <span className="tabular-nums">{formatDuration(pattern.durationSeconds)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NearbyPage() {
  const [coords, setCoords] = useState<Coords>(null);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const [stops, setStops] = useState<NearbyStopDepartures[] | null>(null);
  const [stopsError, setStopsError] = useState(false);
  const [stations, setStations] = useState<CityBikeStation[] | null>(null);
  const [stationsError, setStationsError] = useState(false);
  const [stopsExpanded, setStopsExpanded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const places = useSyncExternalStore(subscribePlaces, getPlaces, getServerPlaces);
  const [trips, setTrips] = useState<Record<string, TripPattern[] | null>>({});
  const [tripErrors, setTripErrors] = useState<Record<string, boolean>>({});

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
    const stopsParams = new URLSearchParams(params);
    stopsParams.set("maxStops", String(STOPS_FETCH_LIMIT));
    const bikeParams = new URLSearchParams(params);
    bikeParams.set("limit", String(BIKE_LIMIT));

    const [stopsRes, bikeRes] = await Promise.allSettled([
      fetch(`/api/bus/nearby?${stopsParams}`),
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

  useEffect(() => {
    if (!coords || places.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        places.map(async (place) => {
          try {
            const params = new URLSearchParams({
              fromLat: String(coords.lat),
              fromLon: String(coords.lon),
              toLat: String(place.lat),
              toLon: String(place.lon),
              toName: place.name,
            });
            const res = await fetch(`/api/trip?${params}`);
            if (!res.ok) throw new Error();
            const json = (await res.json()) as TripPattern[];
            return { id: place.id, patterns: json, error: false };
          } catch {
            return { id: place.id, patterns: null as TripPattern[] | null, error: true };
          }
        })
      );
      if (cancelled) return;
      setTrips((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.id] = r.patterns;
        return next;
      });
      setTripErrors((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.id] = r.error;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, places]);

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
          <MapPin size={13} weight="light" />
          Reiser
        </div>
        <PlaceSearch onAdd={addPlace} />
        {!coords ? (
          <div className="text-text-5 text-sm">
            Posisjon nødvendig for å beregne reiser
          </div>
        ) : places.length === 0 ? (
          <div className="text-text-5 text-sm">Ingen lagrede steder ennå</div>
        ) : (
          <div className="space-y-3">
            {places
              .filter((place) => {
                const p = trips[place.id];
                // An empty (not null/undefined) array means the fetch
                // succeeded but found nothing worth showing — e.g. you're
                // already basically at that place. Hide it entirely.
                return p === undefined || p === null || p.length > 0;
              })
              .map((place) => (
                <TripCard
                  key={place.id}
                  place={place}
                  patterns={trips[place.id]}
                  error={tripErrors[place.id]}
                  onRemove={() => removePlace(place.id)}
                />
              ))}
          </div>
        )}
      </section>

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
            {(stopsExpanded ? stops : stops.slice(0, STOPS_PREVIEW_COUNT)).map((stop) => (
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
            {!stopsExpanded && stops.length > STOPS_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setStopsExpanded(true)}
                aria-label="Vis flere stoppesteder"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/40 py-2 text-text-3 hover:text-text-2 hover:bg-surface/70 transition-colors text-sm"
              >
                <Plus size={14} weight="light" />
                Vis flere
              </button>
            )}
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
