"use client";

import { useEffect, useState } from "react";
import {
  XIcon as X,
  BusIcon as Bus,
  MagnifyingGlassIcon as MagnifyingGlass,
  PlusIcon as Plus,
  TrashIcon as Trash,
  ArrowCounterClockwiseIcon as ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
  type SavedStop,
  addStop,
  removeStop,
  resetToDefaults,
} from "@/lib/bus-stops";
import type { StopSearchResult } from "@/app/api/bus/search/route";

export default function BusSettingsModal({
  stops,
  onClose,
}: {
  stops: SavedStop[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StopSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearchError(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bus/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { results: StopSearchResult[] };
        setResults(json.results ?? []);
        setSearchError(false);
      } catch {
        setSearchError(true);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const savedIds = new Set(stops.map((s) => s.stopId));

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
              <Bus size={11} weight="light" />
              <span>Bussinnstillinger</span>
            </div>
            <div className="text-text-2 text-sm font-light mt-0.5">
              Søk og velg stoppesteder
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

        <div className="p-5 border-b border-border">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              weight="light"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
            />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter stoppested…"
              className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-text-2 text-sm font-light placeholder:text-text-4 focus:outline-none focus:border-border-strong"
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface-2/40">
              {searching && results.length === 0 ? (
                <div className="text-text-5 text-xs p-3 animate-pulse">Søker…</div>
              ) : searchError ? (
                <div className="text-text-5 text-xs p-3">Søk feilet</div>
              ) : results.length === 0 ? (
                <div className="text-text-5 text-xs p-3">Ingen treff</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {results.map((r) => {
                    const added = savedIds.has(r.id);
                    return (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-text-2 text-sm font-light truncate">
                            {r.name}
                          </div>
                          <div className="text-text-4 text-[10px] font-light truncate">
                            {r.locality}
                            {r.categories.length > 0 ? ` · ${r.categories.join(", ")}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() =>
                            addStop({ stopId: r.id, name: r.name, maxDepartures: 5 })
                          }
                          className="text-xs px-2 py-1 rounded border border-border text-text-2 hover:bg-surface enabled:cursor-pointer disabled:text-text-5 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1"
                        >
                          <Plus size={11} weight="light" />
                          {added ? "Lagt til" : "Legg til"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-text-3 text-xs uppercase tracking-widest">
              Lagrede stoppesteder
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="flex items-center gap-1 text-text-4 hover:text-text-2 text-xs transition-colors"
              aria-label="Tilbakestill"
            >
              <ArrowCounterClockwise size={11} weight="light" />
              Tilbakestill
            </button>
          </div>

          {stops.length === 0 ? (
            <div className="text-text-5 text-sm font-light">Ingen stoppesteder lagret</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {stops.map((s) => (
                <li
                  key={s.stopId}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-text-2 text-sm font-light truncate">
                      {s.name ?? s.stopId}
                    </div>
                    <div className="text-text-4 text-[10px] font-light truncate">
                      {s.stopId} · {s.maxDepartures} avganger
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStop(s.stopId)}
                    className="text-text-3 hover:text-live transition-colors p-1 shrink-0"
                    aria-label={`Fjern ${s.name ?? s.stopId}`}
                  >
                    <Trash size={14} weight="light" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
