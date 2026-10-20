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
import TripMap from "@/components/TripMap";
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
import type { ServiceJourneyDetails } from "@/lib/types/serviceJourney";
import type { PlaceSearchResult, TripPattern } from "@/lib/types/trip";

const POLL_MS = 30 * 1000;
const BIKE_LIMIT = 3;
const SEARCH_DEBOUNCE_MS = 300;
const STOPS_FETCH_LIMIT = 8;
const STOPS_PREVIEW_COUNT = 3;
const DEPARTURES_FETCH_LIMIT = 10;
const DEPARTURES_PREVIEW_COUNT = 5;

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
  onOpenDetails,
}: {
  place: SavedPlace;
  patterns: TripPattern[] | null | undefined;
  error: boolean | undefined;
  onRemove: () => void;
  onOpenDetails: (pattern: TripPattern) => void;
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
            <button
              key={idx}
              type="button"
              onClick={() => onOpenDetails(pattern)}
              className={`w-full text-left rounded-lg -mx-1 px-1 hover:bg-surface/70 transition-colors ${
                idx > 0 ? "pt-3 mt-3 border-t border-border/60" : ""
              }`}
            >
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TripDetailsModal({
  place,
  pattern,
  onClose,
  onOpenServiceJourney,
}: {
  place: SavedPlace;
  pattern: TripPattern;
  onClose: () => void;
  onOpenServiceJourney: (args: {
    serviceJourneyId: string;
    fromStopName: string;
    destination: string;
    line: string;
    lineColor: string | null;
  }) => void;
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
        className="bg-surface border border-border rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div>
            <div className="text-text-2 font-light">Til {place.name}</div>
            <div className="text-text-4 text-xs mt-0.5 tabular-nums">
              {formatClock(pattern.expectedStartTime)} – {formatClock(pattern.expectedEndTime)} ·{" "}
              {formatDuration(pattern.durationSeconds)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="text-text-3 hover:text-text-2 transition-colors -mr-1 -mt-1 p-1 shrink-0"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <TripMap legs={pattern.legs} />
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-text-2 text-sm font-light">
              {pattern.legs[0].fromName}
            </span>
            <span className="text-text-4 text-xs tabular-nums shrink-0">
              {formatClock(pattern.expectedStartTime)}
            </span>
          </div>

          {pattern.legs.map((leg, i) => {
            const Icon = modeIcon(leg.mode);
            const isTransit = leg.mode !== "foot";
            return (
              <div key={i}>
                <div className="flex items-start gap-2 pl-1 py-2 border-l border-border ml-[7px]">
                  <Icon size={14} weight="light" className="text-text-4 -ml-[15px] bg-surface shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {leg.line && (
                        <span
                          className="font-medium text-text-2 bg-surface-2 rounded px-1 py-0.5 tabular-nums"
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
                      )}
                      <span className="text-text-3">
                        {isTransit
                          ? [leg.lineName, leg.operatorName].filter(Boolean).join(" · ")
                          : `Gange · ${leg.distanceMeters} m`}
                      </span>
                      <span className="text-text-5">· {formatDuration(leg.durationSeconds)}</span>
                      {isTransit && !leg.realtime && (
                        <span className="text-text-5">· rutetid</span>
                      )}
                    </div>
                    {leg.situations.length > 0 && (
                      <div className="text-live text-xs mt-1">{leg.situations.join(" · ")}</div>
                    )}
                    {isTransit && leg.serviceJourneyId && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenServiceJourney({
                            serviceJourneyId: leg.serviceJourneyId!,
                            fromStopName: leg.fromName,
                            destination: leg.toName,
                            line: leg.line ?? "",
                            lineColor: leg.lineColor,
                          })
                        }
                        className="text-accent text-xs mt-1 hover:underline"
                      >
                        Vis hele ruta
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-2 text-sm font-light truncate">{leg.toName}</span>
                  <span className="text-text-4 text-xs tabular-nums shrink-0">
                    {formatClock(leg.expectedEndTime)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ServiceJourneyModal({
  serviceJourneyId,
  fromStopName,
  destination,
  line,
  lineColor,
  onClose,
}: {
  serviceJourneyId: string;
  fromStopName: string;
  destination: string;
  line: string;
  lineColor: string | null;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<ServiceJourneyDetails | null>(null);
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
    fetch(`/api/service-journey?id=${encodeURIComponent(serviceJourneyId)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<ServiceJourneyDetails>;
      })
      .then((json) => {
        if (!cancelled) setDetails(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceJourneyId]);

  const calls = (() => {
    if (!details) return [];
    const idx = details.calls.findIndex((c) => c.stopName === fromStopName);
    return idx >= 0 ? details.calls.slice(idx) : details.calls;
  })();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs font-medium text-text-2 bg-surface-2 rounded px-1.5 py-0.5 tabular-nums shrink-0"
              style={
                lineColor
                  ? { backgroundColor: hexToRgba(lineColor, 0.4), color: lineColor }
                  : undefined
              }
            >
              {line}
            </span>
            <div className="min-w-0">
              <div className="text-text-2 font-light truncate">{destination}</div>
              {details?.operatorName && (
                <div className="text-text-5 text-xs truncate">{details.operatorName}</div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Lukk"
            className="text-text-3 hover:text-text-2 transition-colors -mr-1 -mt-1 p-1 shrink-0"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        {details && details.notices.length > 0 && (
          <div className="px-5 py-2 border-b border-border bg-live/10 text-live text-xs">
            {details.notices.join(" · ")}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {!details ? (
            <div className="text-text-5 text-sm animate-pulse p-5">
              {error ? "Reisedetaljer utilgjengelig" : "Laster…"}
            </div>
          ) : calls.length === 0 ? (
            <div className="text-text-4 text-sm p-5">Ingen holdeplasser funnet</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {calls.map((call, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      i === 0 ? "bg-accent" : "bg-text-5"
                    }`}
                  />
                  <span
                    className={`flex-1 truncate font-light ${
                      i === 0 ? "text-text-2" : "text-text-3"
                    }`}
                  >
                    {call.stopName}
                  </span>
                  {!call.realtime && (
                    <span className="text-text-5 text-[10px] shrink-0">rutetid</span>
                  )}
                  <span className="text-xs tabular-nums shrink-0 text-text-3">
                    {formatClock(call.expectedArrivalTime)}
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

export default function NearbyPage() {
  const [coords, setCoords] = useState<Coords>(null);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const [stops, setStops] = useState<NearbyStopDepartures[] | null>(null);
  const [stopsError, setStopsError] = useState(false);
  const [stations, setStations] = useState<CityBikeStation[] | null>(null);
  const [stationsError, setStationsError] = useState(false);
  const [stopsExpanded, setStopsExpanded] = useState(false);
  const [expandedDepartures, setExpandedDepartures] = useState<Set<string>>(new Set());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openJourney, setOpenJourney] = useState<{
    serviceJourneyId: string;
    fromStopName: string;
    destination: string;
    line: string;
    lineColor: string | null;
  } | null>(null);
  const [openTripDetails, setOpenTripDetails] = useState<{
    place: SavedPlace;
    pattern: TripPattern;
  } | null>(null);

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
    stopsParams.set("count", String(DEPARTURES_FETCH_LIMIT));
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
                  onOpenDetails={(pattern) => setOpenTripDetails({ place, pattern })}
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
                  {(expandedDepartures.has(stop.stopId)
                    ? stop.departures
                    : stop.departures.slice(0, DEPARTURES_PREVIEW_COUNT)
                  ).map((dep, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setOpenJourney({
                          serviceJourneyId: dep.serviceJourneyId,
                          fromStopName: stop.stopName,
                          destination: dep.destination,
                          line: dep.line,
                          lineColor: dep.color,
                        })
                      }
                      className="w-full flex items-center gap-3 text-sm -mx-1 px-1 py-0.5 rounded-lg hover:bg-surface/70 transition-colors text-left"
                    >
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
                    </button>
                  ))}
                  {!expandedDepartures.has(stop.stopId) &&
                    stop.departures.length > DEPARTURES_PREVIEW_COUNT && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDepartures((prev) => new Set(prev).add(stop.stopId))
                        }
                        aria-label={`Vis flere avganger for ${stop.stopName}`}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-text-4 hover:text-text-2 hover:bg-surface/70 transition-colors text-xs"
                      >
                        <Plus size={12} weight="light" />
                        Vis flere
                      </button>
                    )}
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

      {openTripDetails && (
        <TripDetailsModal
          place={openTripDetails.place}
          pattern={openTripDetails.pattern}
          onClose={() => setOpenTripDetails(null)}
          onOpenServiceJourney={setOpenJourney}
        />
      )}

      {openJourney && (
        <ServiceJourneyModal
          serviceJourneyId={openJourney.serviceJourneyId}
          fromStopName={openJourney.fromStopName}
          destination={openJourney.destination}
          line={openJourney.line}
          lineColor={openJourney.lineColor}
          onClose={() => setOpenJourney(null)}
        />
      )}
    </main>
  );
}
